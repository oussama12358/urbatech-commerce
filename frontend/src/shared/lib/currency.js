// First-visit currency detection. A user's saved selection always takes priority.
const COUNTRY_CURRENCIES = {
  TN: "TND", US: "USD", CA: "CAD", GB: "GBP", AU: "AUD", NZ: "NZD", JP: "JPY", CN: "CNY",
  BR: "BRL", MX: "MXN", CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN", CZ: "CZK",
  HU: "HUF", IL: "ILS", TH: "THB", TW: "TWD", SG: "SGD", HK: "HKD", PH: "PHP", MY: "MYR",
  ZA: "ZAR", AE: "AED", SA: "SAR", QA: "QAR", KW: "KWD", BH: "BHD", OM: "OMR", IN: "INR",
  KR: "KRW", ID: "IDR", TR: "TRY", RO: "RON", RU: "RUB", UA: "UAH", AR: "ARS", CL: "CLP",
  CO: "COP", PE: "PEN", UY: "UYU", EG: "EGP", MA: "MAD", DZ: "DZD", NG: "NGN", KE: "KES"
};

const EURO_COUNTRIES = new Set("AT BE BG HR CY EE FI FR DE GR IE IT LV LT LU MT NL PT SK SI ES AD MC SM VA".split(" "));

function browserCountry() {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale || navigator.language || "";
  const match = locale.match(/[-_]([A-Z]{2})\b/i);
  return match?.[1]?.toUpperCase() || "";
}

export function defaultCurrencyForCountry(countryCode) {
  const code = String(countryCode || browserCountry()).trim().toUpperCase();
  return COUNTRY_CURRENCIES[code] || (EURO_COUNTRIES.has(code) ? "EUR" : "USD");
}

export function currencyOptionLabel(currency) {
  const code = String(currency?.code || "").toUpperCase();
  const symbol = String(currency?.symbol || "").trim();
  const name = currency?.name || code;
  // ISO code is already the correct identifier when no separate symbol exists.
  return symbol && symbol !== code ? `${symbol} — ${code} — ${name}` : `${code} — ${name}`;
}
