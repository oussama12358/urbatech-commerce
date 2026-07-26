import { getCountryByCode, getCountryByName } from "./countries.js";

/**
 * Normalize free-form country input to ISO alpha-2 code.
 */
export function toCountryCode(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const upper = raw.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper) && getCountryByCode(upper)) return upper;

  const byName = getCountryByName(raw);
  if (byName) return byName.code;

  const codeMatch = upper.match(/\b([A-Z]{2})\b/);
  if (codeMatch && getCountryByCode(codeMatch[1])) return codeMatch[1];

  return null;
}

/**
 * @returns {string[]} unique ISO codes
 */
export function normalizeCountryCodes(list) {
  if (!list) return [];
  const values = Array.isArray(list)
    ? list
    : String(list)
        .split(/[|;,/]+/)
        .map((item) => item.trim())
        .filter(Boolean);

  const codes = [];
  const seen = new Set();
  for (const value of values) {
    const code = toCountryCode(value);
    if (code && !seen.has(code)) {
      seen.add(code);
      codes.push(code);
    }
  }
  return codes;
}

export function getProductShipsTo(product) {
  if (product?.ships_worldwide) return null;
  const codes = normalizeCountryCodes(product?.ships_to_countries);
  return codes.length ? codes : null;
}

export function detectBrowserCountryCode() {
  if (typeof window === "undefined") return "";

  const locale = (navigator.languages && navigator.languages.find(Boolean)) || navigator.language || "";
  if (!locale) return "";

  const match = locale.match(/[-_]([A-Za-z]{2})$/);
  const code = match ? match[1].toUpperCase() : locale.length === 2 ? locale.toUpperCase() : "";
  return code && getCountryByCode(code) ? code : "";
}

/**
 * Check if a product can ship to a destination country.
 * If destination is unknown and product is worldwide → available.
 * If destination is unknown and product is restricted → available: null (unknown).
 */
export function isProductAvailableInCountry(product, countryInput) {
  const shipsTo = getProductShipsTo(product);
  const countryCode = toCountryCode(
    typeof countryInput === "object"
      ? countryInput?.code || countryInput?.country_code || countryInput?.country
      : countryInput
  );

  if (!shipsTo) {
    return { available: true, unknown: false, countryCode, shipsTo: null, shipsWorldwide: true };
  }

  if (!countryCode) {
    return { available: null, unknown: true, countryCode: null, shipsTo, shipsWorldwide: false };
  }

  return {
    available: shipsTo.includes(countryCode),
    unknown: false,
    countryCode,
    shipsTo,
    shipsWorldwide: false
  };
}

export function formatShipsToLabel(product, max = 6) {
  const shipsTo = getProductShipsTo(product);
  if (!shipsTo) return null;
  const names = shipsTo.map((code) => getCountryByCode(code)?.name || code);
  if (names.length <= max) return names.join(", ");
  return `${names.slice(0, max).join(", ")} +${names.length - max}`;
}

const SHIPPING_COUNTRY_KEY = "ut_shipping_country";
const SHIPPING_COUNTRY_EVENT = "ut:shipping-country";

export function readStoredShippingCountryCode() {
  try {
    return localStorage.getItem(SHIPPING_COUNTRY_KEY) || "";
  } catch {
    return "";
  }
}

export function readShippingCountryCode() {
  try {
    const stored = readStoredShippingCountryCode();
    if (stored) return stored;
    return detectBrowserCountryCode();
  } catch {
    return "";
  }
}

export function writeShippingCountryCode(code) {
  try {
    if (!code) localStorage.removeItem(SHIPPING_COUNTRY_KEY);
    else localStorage.setItem(SHIPPING_COUNTRY_KEY, String(code).toUpperCase());
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(SHIPPING_COUNTRY_EVENT, {
        detail: { code: code ? String(code).toUpperCase() : "" }
      })
    );
  }
}

export function subscribeShippingCountry(handler) {
  if (typeof window === "undefined") return () => {};
  const onCustom = (event) => handler(event?.detail?.code || readShippingCountryCode());
  const onStorage = (event) => {
    if (event.key === SHIPPING_COUNTRY_KEY) handler(event.newValue || "");
  };
  window.addEventListener(SHIPPING_COUNTRY_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SHIPPING_COUNTRY_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
