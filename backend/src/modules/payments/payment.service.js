import Stripe from "stripe";
import { getCollection, createId } from "../../db/mongo.js";
import { env } from "../../config/env.js";
import { localProviderConfigured } from "./local-payment.service.js";

const stripe = env.stripeSecretKey ? new Stripe(env.stripeSecretKey) : null;
const SECRET_KEYS = new Set(["stripeSecretKey", "clientSecret", "apiKey", "apiSecret", "webhookSecret", "webhookId", "accessToken", "privateKey"]);

export const PAYMENT_PROVIDER_CATALOG = [
  { provider_key: "stripe", name: "Stripe", description: "Cards, Apple Pay and Google Pay where the connected Stripe account supports them.", integration: "stripe", methods: ["card", "apple_pay", "google_pay"] },
  { provider_key: "paypal", name: "PayPal", description: "PayPal and eligible card payments through the connected PayPal business account.", integration: "paypal", methods: ["paypal", "card"] },
  { provider_key: "konnect", name: "Konnect", description: "Tunisian online payment provider with verified server-side checkout and payment status confirmation.", integration: "konnect", methods: ["card", "e_dinar"] },
  { provider_key: "paymee", name: "Paymee", description: "Tunisian online payment provider with signed webhook confirmation.", integration: "paymee", methods: ["card", "e_dinar"] },
  { provider_key: "flouci", name: "Flouci", description: "Tunisian checkout provider with server-side payment verification.", integration: "flouci", methods: ["flouci_wallet", "card"] }
];

function defaultEnabledForKey(key) {
  if (key === "stripe") return Boolean(env.stripeSecretKey);
  if (key === "paypal") return Boolean(env.paypalClientId && env.paypalClientSecret);
  if (["konnect", "paymee", "flouci"].includes(key)) return localProviderConfigured(key);
  return false;
}

function catalogEntry(key) {
  return PAYMENT_PROVIDER_CATALOG.find((item) => item.provider_key === key);
}

function defaultProvider(def) {
  return {
    id: createId(), provider_key: def.provider_key, name: def.name, description: def.description,
    integration: def.integration, enabled: defaultEnabledForKey(def.provider_key), merchant_eligible: defaultEnabledForKey(def.provider_key),
    config: { supportedCurrencies: [], supportedCountries: [], enabledMethods: def.methods }
  };
}

function publicConfig(config = {}) {
  return Object.fromEntries(Object.entries(config).filter(([key]) => !SECRET_KEYS.has(key)));
}

function normalizeConfig(config = {}) {
  const next = { ...config };
  for (const field of ["supportedCurrencies", "supported_currencies", "supportedCountries", "supported_countries", "enabledMethods"]) {
    if (typeof next[field] === "string") next[field] = next[field].split(",").map((v) => v.trim()).filter(Boolean);
  }
  return next;
}

function serializeProvider(provider, { includeConfig = false } = {}) {
  const configuredCurrencies = provider.config?.supportedCurrencies || provider.config?.supported_currencies || [];
  const configuredCountries = provider.config?.supportedCountries || provider.config?.supported_countries || [];
  const entry = catalogEntry(provider.provider_key);
  return {
    id: provider.id, provider_key: provider.provider_key,
    // Stripe is an implementation detail: customers buy with Card, while
    // administrators still see the provider's real integration name.
    name: !includeConfig && provider.provider_key === "stripe" ? "Card" : provider.name,
    description: provider.description || "",
    integration: provider.integration || entry?.integration || "external", enabled: Boolean(provider.enabled), merchant_eligible: Boolean(provider.merchant_eligible),
    supported_currencies: Array.isArray(configuredCurrencies) ? configuredCurrencies.map((value) => String(value).toUpperCase()) : [],
    supported_countries: Array.isArray(configuredCountries) ? configuredCountries.map((value) => String(value).toUpperCase()) : [],
    methods: entry?.methods || [], enabled_methods: provider.config?.enabledMethods || entry?.methods || [],
    configured: isProviderConfigured(provider),
    ...(includeConfig ? { config: publicConfig(provider.config || {}) } : {})
  };
}

export function isStripeProvider(providerKey) { return providerKey === "stripe"; }
export function isPayPalProvider(providerKey) { return providerKey === "paypal"; }
export function isKonnectProvider(providerKey) { return providerKey === "konnect"; }
export function isPaymeeProvider(providerKey) { return providerKey === "paymee"; }
export function isFlouciProvider(providerKey) { return providerKey === "flouci"; }

export function isProviderConfigured(provider) {
  if (!provider) return false;
  if (isStripeProvider(provider.provider_key)) return Boolean(provider.config?.stripeSecretKey || env.stripeSecretKey);
  if (isPayPalProvider(provider.provider_key)) return Boolean((provider.config?.clientId || env.paypalClientId) && (provider.config?.clientSecret || env.paypalClientSecret));
  if (["konnect", "paymee", "flouci"].includes(provider.provider_key)) return localProviderConfigured(provider.provider_key);
  return false;
}

export function isRedirectPaymentProvider(provider) {
  return Boolean(provider?.enabled && provider?.merchant_eligible && isProviderConfigured(provider));
}

export async function ensureDefaultPaymentProviders() {
  const providers = await getCollection("payment_providers");
  for (const def of PAYMENT_PROVIDER_CATALOG) {
    const existing = await providers.findOne({ provider_key: def.provider_key });
    if (!existing) await providers.insertOne(defaultProvider(def));
    else {
      const configured = isProviderConfigured(existing);
      await providers.updateOne(
        { provider_key: def.provider_key },
        {
          $set: {
            integration: existing.integration === "external" ? def.integration : (existing.integration || def.integration),
            "config.enabledMethods": existing.config?.enabledMethods || def.methods,
            merchant_eligible: configured,
            enabled: configured ? Boolean(existing.enabled) : false
          }
        }
      );
    }
  }
  return providers.find().project({ _id: 0 }).toArray();
}

export async function getPaymentProviders({ admin = false } = {}) {
  await ensureDefaultPaymentProviders();
  const providers = await getCollection("payment_providers");
  const docs = await providers.find(admin ? {} : { enabled: true, merchant_eligible: true }).project({ _id: 0 }).sort({ name: 1 }).toArray();
  return docs.filter((provider) => admin || isRedirectPaymentProvider(provider)).map((provider) => serializeProvider(provider, { includeConfig: admin }));
}

export async function getPaymentProviderRecordByKey(providerKey) {
  await ensureDefaultPaymentProviders();
  return (await getCollection("payment_providers")).findOne({ provider_key: providerKey }, { projection: { _id: 0 } });
}

export async function getPaymentProviderById(id) {
  await ensureDefaultPaymentProviders();
  const provider = await (await getCollection("payment_providers")).findOne({ id }, { projection: { _id: 0 } });
  return provider ? serializeProvider(provider, { includeConfig: true }) : null;
}

export async function getPaymentProviderByKey(providerKey) {
  const provider = await getPaymentProviderRecordByKey(providerKey);
  return provider ? serializeProvider(provider, { includeConfig: false }) : null;
}

export async function updatePaymentProvider(id, payload) {
  const providers = await getCollection("payment_providers");
  const provider = await providers.findOne({ id }, { projection: { _id: 0 } });
  if (!provider) return null;
  const next = {
    ...provider, name: payload.name ?? provider.name, description: payload.description ?? provider.description,
    merchant_eligible: payload.merchant_eligible ?? provider.merchant_eligible,
    config: payload.config ? normalizeConfig({ ...provider.config, ...payload.config }) : provider.config
  };
  // A provider cannot be switched on until the server can make a real, authenticated checkout request.
  next.enabled = payload.enabled ?? provider.enabled;
  if (next.enabled && !isRedirectPaymentProvider(next)) throw new Error("This provider cannot be enabled yet: add verified merchant credentials and a live server integration first.");
  await providers.updateOne({ id }, { $set: next });
  return serializeProvider(next, { includeConfig: true });
}

export function getStripeClient(config = {}) { return config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : stripe; }
export function stripeEnabled() { return Boolean(stripe); }
export async function getProviderByKey(providerKey) { return providerKey ? getPaymentProviderByKey(providerKey) : null; }
