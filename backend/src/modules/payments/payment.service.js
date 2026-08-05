import Stripe from "stripe";
import { getCollection, createId } from "../../db/mongo.js";
import { env } from "../../config/env.js";

const stripe = env.stripeSecretKey ? new Stripe(env.stripeSecretKey) : null;

function defaultEnabledForKey(key) {
  if (key === "stripe") return Boolean(env.stripeSecretKey);
  if (key === "paypal") return Boolean(env.paypalClientId && env.paypalClientSecret);
  return false;
}

const DEFAULT_PAYMENT_PROVIDERS = [
  {
    id: createId(),
    provider_key: "stripe",
    name: "Stripe",
    description: "Credit/debit card payments plus Apple Pay and Google Pay where supported.",
    enabled: defaultEnabledForKey("stripe"),
    config: {}
  },
  {
    id: createId(),
    provider_key: "paypal",
    name: "PayPal",
    description: "Pay with PayPal or supported card payments through PayPal.",
    enabled: defaultEnabledForKey("paypal"),
    config: {}
  }
];

const DIRECT_PAYMENT_KEYS = new Set(DEFAULT_PAYMENT_PROVIDERS.map((provider) => provider.provider_key));

export function isStripeProvider(providerKey) {
  return providerKey === "stripe";
}

export function isPayPalProvider(providerKey) {
  return providerKey === "paypal";
}

export function isRedirectPaymentProvider(provider) {
  if (!provider?.enabled) return false;
  if (isStripeProvider(provider.provider_key)) {
    return Boolean(provider.config?.stripeSecretKey || env.stripeSecretKey);
  }
  if (isPayPalProvider(provider.provider_key)) {
    return Boolean(
      (provider.config?.clientId || env.paypalClientId) &&
      (provider.config?.clientSecret || env.paypalClientSecret)
    );
  }
  return false;
}

function serializeProvider(provider, includeConfig = false) {
  const configuredCurrencies = provider.config?.supportedCurrencies || provider.config?.supported_currencies;
  return {
    id: provider.id,
    provider_key: provider.provider_key,
    name: provider.name,
    description: provider.description || "",
    enabled: Boolean(provider.enabled),
    // Safe for storefront use; credentials remain server-only.
    supported_currencies: Array.isArray(configuredCurrencies)
      ? configuredCurrencies.map((currency) => String(currency).toUpperCase())
      : [],
    ...(includeConfig ? { config: provider.config || {} } : {})
  };
}

export async function ensureDefaultPaymentProviders() {
  const providers = await getCollection("payment_providers");
  const count = await providers.countDocuments();
  if (count === 0) {
    await providers.insertMany(DEFAULT_PAYMENT_PROVIDERS);
    return DEFAULT_PAYMENT_PROVIDERS.map((provider) => serializeProvider(provider, true));
  }

  const existingKeys = new Set(
    (await providers.find().project({ provider_key: 1 }).toArray()).map((item) => item.provider_key)
  );
  const missing = DEFAULT_PAYMENT_PROVIDERS.filter((provider) => !existingKeys.has(provider.provider_key));
  if (missing.length > 0) {
    await providers.insertMany(missing);
  }

  // Sync enabled status from .env credentials on every call
  // If credentials exist -> auto-enable. If credentials removed -> disable.
  for (const def of DEFAULT_PAYMENT_PROVIDERS) {
    const shouldBeEnabled = defaultEnabledForKey(def.provider_key);
    await providers.updateOne(
      { provider_key: def.provider_key, enabled: { $ne: shouldBeEnabled } },
      { $set: { enabled: shouldBeEnabled } }
    );
  }

  return providers
    .find()
    .project({ _id: 0, id: 1, provider_key: 1, name: 1, description: 1, enabled: 1, config: 1 })
    .toArray();
}

export async function getPaymentProviders({ admin = false } = {}) {
  await ensureDefaultPaymentProviders();
  const providers = await getCollection("payment_providers");
  const query = admin ? {} : { enabled: true };
  const docs = await providers.find(query).project({ _id: 0 }).sort({ name: 1 }).toArray();
  return docs
    .filter((provider) => DIRECT_PAYMENT_KEYS.has(provider.provider_key))
    .filter((provider) => admin || isRedirectPaymentProvider(provider))
    .map((provider) => serializeProvider(provider, admin));
}

export async function getPaymentProviderById(id) {
  const providers = await getCollection("payment_providers");
  const provider = await providers.findOne({ id });
  return provider ? serializeProvider(provider, true) : null;
}

export async function getPaymentProviderByKey(providerKey) {
  const providers = await getCollection("payment_providers");
  const provider = await providers.findOne({ provider_key: providerKey });
  return provider ? serializeProvider(provider, true) : null;
}

export async function createPaymentProvider(payload) {
  const providers = await getCollection("payment_providers");
  const existing = await providers.findOne({ provider_key: payload.provider_key });
  if (existing) {
    throw new Error("A payment provider with this key already exists.");
  }

  const provider = {
    id: createId(),
    provider_key: payload.provider_key,
    name: payload.name,
    description: payload.description || "",
    enabled: Boolean(payload.enabled),
    config: payload.config || {}
  };
  await providers.insertOne(provider);
  return serializeProvider(provider, true);
}

export async function updatePaymentProvider(id, payload) {
  const providers = await getCollection("payment_providers");
  const provider = await providers.findOne({ id });
  if (!provider) {
    return null;
  }
  const next = {
    ...provider,
    name: payload.name ?? provider.name,
    description: payload.description ?? provider.description,
    enabled: payload.enabled ?? provider.enabled,
    config: payload.config ?? provider.config
  };

  if (next.enabled && !isRedirectPaymentProvider(next)) {
    throw new Error("Configure real gateway credentials before enabling this payment method.");
  }

  await providers.updateOne({ id }, { $set: next });
  return serializeProvider(next, true);
}

export async function deletePaymentProvider(id) {
  const providers = await getCollection("payment_providers");
  await providers.deleteOne({ id });
}

export async function getStripeProvider() {
  const provider = await getPaymentProviderByKey("stripe");
  return provider;
}

export function stripeEnabled() {
  return Boolean(stripe);
}

export function getStripeClient(config = {}) {
  if (config.stripeSecretKey) {
    return new Stripe(config.stripeSecretKey);
  }
  return stripe;
}

export async function getProviderByKey(payloadProviderKey) {
  if (!payloadProviderKey) return null;
  return getPaymentProviderByKey(payloadProviderKey);
}

