import { env } from "../../config/env.js";
import { getCollection } from "../../db/mongo.js";

// Product prices are stored in their original selling currency.  Rates are cached
// only to protect the rate provider; converted prices are never persisted.
export const PAYPAL_CURRENCIES = new Set(["AUD", "BRL", "CAD", "CNY", "CZK", "DKK", "EUR", "HKD", "HUF", "ILS", "JPY", "MYR", "MXN", "NZD", "NOK", "PHP", "PLN", "GBP", "SGD", "SEK", "CHF", "THB", "TWD", "USD"]);
export const ZERO_DECIMAL_CURRENCIES = new Set(["BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF", "HUF", "TWD"]);
// Stripe supports more than 135 presentment currencies for card payments. The
// final availability still depends on the Stripe account country/payment method.
export const STRIPE_CURRENCIES = new Set("USD AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BIF BMD BND BOB BRL BSD BWP BYN BZD CAD CDF CHF CLP CNY COP CRC CVE CZK DJF DKK DOP DZD EGP ETB EUR FJD FKP GBP GEL GIP GMD GNF GTQ GYD HKD HNL HRK HTG HUF IDR ILS INR ISK JMD JPY KES KGS KHR KMF KRW KYD KZT LAK LBP LKR LRD LSL MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MYR MZN NAD NGN NIO NOK NPR NZD PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SEK SGD SHP SLE SLL SOS SRD STD SZL THB TJS TOP TRY TTD TWD TZS UAH UGX UYU UZS VES VND VUV WST XAF XCD XOF XPF YER ZAR ZMW TND".split(" "));
// Display/conversion currencies include every local currency selected from the
// storefront country list. A gateway is still offered only when it supports it.
export const DISPLAY_CURRENCIES = new Set([
  ...STRIPE_CURRENCIES,
  ..."BGN BHD BTN CUP ERN GHS IQD IRR JOD KPW KWD LYD OMR SDG SSP STN SYP TMT".split(" ")
]);

const currencyNames = new Intl.DisplayNames(["en"], { type: "currency" });
// Intl provides reliable symbols for most currencies. These overrides preserve
// recognised local symbols where a browser returns only an ISO code or `$`.
const CURRENCY_SYMBOL_OVERRIDES = {
  AED: "د.إ", BHD: "د.ب", DZD: "د.ج", JOD: "د.ا", KWD: "د.ك", MAD: "د.م.",
  OMR: "ر.ع.", QAR: "ر.ق", SAR: "ر.س", TND: "د.ت", AWG: "ƒ", BRL: "R$",
  CAD: "CA$", CNY: "CN¥", DOP: "RD$", HKD: "HK$", MXN: "MX$", NZD: "NZ$",
  SGD: "S$", TWD: "NT$", FJD: "FJ$", GYD: "GY$", IDR: "Rp", MYR: "RM",
  PHP: "₱", THB: "฿", VND: "₫", ETB: "Br"
};
let cachedRates = null;
let fetchedAt = 0;

export function normalizeCurrency(value, fallback = "USD") {
  const code = String(value || fallback).trim().toUpperCase();
  return DISPLAY_CURRENCIES.has(code) ? code : fallback;
}

export function minorUnitMultiplier(currency) {
  return ZERO_DECIMAL_CURRENCIES.has(currency) ? 1 : 100;
}

export function roundCurrency(value, currency) {
  const digits = ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2;
  return Number(Number(value || 0).toFixed(digits));
}

async function getRates() {
  if (cachedRates && Date.now() - fetchedAt < env.exchangeRateCacheMs) return cachedRates;
  try {
    const response = await fetch(env.exchangeRateApiUrl);
    if (!response.ok) throw new Error(`rate provider returned ${response.status}`);
    const data = await response.json();
    const rates = data.rates || data.conversion_rates;
    if (!rates?.USD) throw new Error("rate provider returned no USD rate");
    cachedRates = { rates: { ...rates, USD: 1 }, fetched_at: new Date() };
    fetchedAt = Date.now();
    // Survives a process restart, so a temporary provider outage does not stop checkout.
    const fxCache = await getCollection("exchange_rate_cache");
    await fxCache.updateOne({ id: "latest-usd" }, { $set: { id: "latest-usd", ...cachedRates } }, { upsert: true });
  } catch (error) {
    if (!cachedRates) {
      try {
        const fxCache = await getCollection("exchange_rate_cache");
        const persisted = await fxCache.findOne({ id: "latest-usd" });
        if (persisted?.rates?.USD) {
          cachedRates = { rates: persisted.rates, fetched_at: persisted.fetched_at || new Date() };
          fetchedAt = Date.now();
        }
      } catch {
        // The original provider error is more useful if persistence is unavailable too.
      }
    }
    if (!cachedRates) throw new Error(`Currency rates are temporarily unavailable: ${error.message}`);
  }
  return cachedRates;
}

export async function convertAmount(amount, fromCurrency, toCurrency) {
  return (await getExchangeQuote(amount, fromCurrency, toCurrency)).amount;
}

export async function getExchangeQuote(amount, fromCurrency, toCurrency) {
  const from = normalizeCurrency(fromCurrency);
  const to = normalizeCurrency(toCurrency);
  // Showing a product in its own base currency must work even while the FX
  // provider is unavailable (first visit, offline development, or outage).
  if (from === to) return { amount: roundCurrency(amount, to), rate: 1, from, to, fetched_at: null };
  const snapshot = await getRates();
  const rates = snapshot.rates;
  if (!rates[from] || !rates[to]) throw new Error(`Exchange rate unavailable for ${from}/${to}`);
  const rate = rates[to] / rates[from];
  return { amount: roundCurrency(Number(amount || 0) * rate, to), rate, from, to, fetched_at: snapshot.fetched_at };
}

export function sellingBasePrice(product) {
  // New records use base_price; legacy price remains a safe migration fallback.
  return Number(product.base_price ?? product.price ?? 0);
}

export function productBaseCurrency(product) {
  return normalizeCurrency(product.base_currency || "USD");
}

export function currencyRegistry() {
  return [...DISPLAY_CURRENCIES].sort().map((code) => ({
    code,
    name: currencyNames.of(code) || code,
    symbol: CURRENCY_SYMBOL_OVERRIDES[code] || new Intl.NumberFormat("en-US", { style: "currency", currency: code, currencyDisplay: "narrowSymbol" })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value || code,
    decimal_digits: ZERO_DECIMAL_CURRENCIES.has(code) ? 0 : 2,
    display: true,
    gateways: { stripe: true, paypal: PAYPAL_CURRENCIES.has(code) }
  }));
}

export function providerSupportsCurrency(providerKey, currency, providerConfig = {}) {
  const code = normalizeCurrency(currency);
  const globallySupported = providerKey === "stripe" ? STRIPE_CURRENCIES.has(code) : providerKey === "paypal" ? PAYPAL_CURRENCIES.has(code) : false;
  const configured = providerConfig?.supportedCurrencies || providerConfig?.supported_currencies;
  // A live account can explicitly narrow the documented list to the currencies
  // enabled for that account/country and its active payment methods.
  return globallySupported && (!Array.isArray(configured) || configured.length === 0 || configured.map((item) => String(item).toUpperCase()).includes(code));
}
