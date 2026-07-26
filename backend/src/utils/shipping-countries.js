/** ISO country codes + common English names for shipping availability checks. */
const COUNTRY_ENTRIES = [
  ["AF", "Afghanistan"], ["AL", "Albania"], ["DZ", "Algeria"], ["AD", "Andorra"], ["AO", "Angola"],
  ["AG", "Antigua and Barbuda"], ["AR", "Argentina"], ["AM", "Armenia"], ["AU", "Australia"],
  ["AT", "Austria"], ["AZ", "Azerbaijan"], ["BS", "Bahamas"], ["BH", "Bahrain"], ["BD", "Bangladesh"],
  ["BB", "Barbados"], ["BY", "Belarus"], ["BE", "Belgium"], ["BZ", "Belize"], ["BJ", "Benin"],
  ["BT", "Bhutan"], ["BO", "Bolivia"], ["BA", "Bosnia and Herzegovina"], ["BW", "Botswana"],
  ["BR", "Brazil"], ["BN", "Brunei"], ["BG", "Bulgaria"], ["BF", "Burkina Faso"], ["BI", "Burundi"],
  ["CV", "Cabo Verde"], ["KH", "Cambodia"], ["CM", "Cameroon"], ["CA", "Canada"],
  ["CF", "Central African Republic"], ["TD", "Chad"], ["CL", "Chile"], ["CN", "China"],
  ["CO", "Colombia"], ["KM", "Comoros"], ["CG", "Congo"], ["CD", "Congo (DRC)"], ["CR", "Costa Rica"],
  ["CI", "Côte d'Ivoire"], ["HR", "Croatia"], ["CU", "Cuba"], ["CY", "Cyprus"], ["CZ", "Czech Republic"],
  ["DK", "Denmark"], ["DJ", "Djibouti"], ["DM", "Dominica"], ["DO", "Dominican Republic"],
  ["EC", "Ecuador"], ["EG", "Egypt"], ["SV", "El Salvador"], ["GQ", "Equatorial Guinea"],
  ["ER", "Eritrea"], ["EE", "Estonia"], ["SZ", "Eswatini"], ["ET", "Ethiopia"], ["FJ", "Fiji"],
  ["FI", "Finland"], ["FR", "France"], ["GA", "Gabon"], ["GM", "Gambia"], ["GE", "Georgia"],
  ["DE", "Germany"], ["GH", "Ghana"], ["GR", "Greece"], ["GD", "Grenada"], ["GT", "Guatemala"],
  ["GN", "Guinea"], ["GW", "Guinea-Bissau"], ["GY", "Guyana"], ["HT", "Haiti"], ["HN", "Honduras"],
  ["HU", "Hungary"], ["IS", "Iceland"], ["IN", "India"], ["ID", "Indonesia"], ["IR", "Iran"],
  ["IQ", "Iraq"], ["IE", "Ireland"], ["IL", "Israel"], ["IT", "Italy"], ["JM", "Jamaica"],
  ["JP", "Japan"], ["JO", "Jordan"], ["KZ", "Kazakhstan"], ["KE", "Kenya"], ["KI", "Kiribati"],
  ["KP", "North Korea"], ["KR", "South Korea"], ["KW", "Kuwait"], ["KG", "Kyrgyzstan"], ["LA", "Laos"],
  ["LV", "Latvia"], ["LB", "Lebanon"], ["LS", "Lesotho"], ["LR", "Liberia"], ["LY", "Libya"],
  ["LI", "Liechtenstein"], ["LT", "Lithuania"], ["LU", "Luxembourg"], ["MG", "Madagascar"],
  ["MW", "Malawi"], ["MY", "Malaysia"], ["MV", "Maldives"], ["ML", "Mali"], ["MT", "Malta"],
  ["MH", "Marshall Islands"], ["MR", "Mauritania"], ["MU", "Mauritius"], ["MX", "Mexico"],
  ["FM", "Micronesia"], ["MD", "Moldova"], ["MC", "Monaco"], ["MN", "Mongolia"], ["ME", "Montenegro"],
  ["MA", "Morocco"], ["MZ", "Mozambique"], ["MM", "Myanmar"], ["NA", "Namibia"], ["NR", "Nauru"],
  ["NP", "Nepal"], ["NL", "Netherlands"], ["NZ", "New Zealand"], ["NI", "Nicaragua"], ["NE", "Niger"],
  ["NG", "Nigeria"], ["MK", "North Macedonia"], ["NO", "Norway"], ["OM", "Oman"], ["PK", "Pakistan"],
  ["PW", "Palau"], ["PS", "Palestine"], ["PA", "Panama"], ["PG", "Papua New Guinea"], ["PY", "Paraguay"],
  ["PE", "Peru"], ["PH", "Philippines"], ["PL", "Poland"], ["PT", "Portugal"], ["QA", "Qatar"],
  ["RO", "Romania"], ["RU", "Russia"], ["RW", "Rwanda"], ["KN", "Saint Kitts and Nevis"],
  ["LC", "Saint Lucia"], ["VC", "Saint Vincent and the Grenadines"], ["WS", "Samoa"],
  ["SM", "San Marino"], ["ST", "Sao Tome and Principe"], ["SA", "Saudi Arabia"], ["SN", "Senegal"],
  ["RS", "Serbia"], ["SC", "Seychelles"], ["SL", "Sierra Leone"], ["SG", "Singapore"],
  ["SK", "Slovakia"], ["SI", "Slovenia"], ["SB", "Solomon Islands"], ["SO", "Somalia"],
  ["ZA", "South Africa"], ["SS", "South Sudan"], ["ES", "Spain"], ["LK", "Sri Lanka"], ["SD", "Sudan"],
  ["SR", "Suriname"], ["SE", "Sweden"], ["CH", "Switzerland"], ["SY", "Syria"], ["TW", "Taiwan"],
  ["TJ", "Tajikistan"], ["TZ", "Tanzania"], ["TH", "Thailand"], ["TL", "Timor-Leste"], ["TG", "Togo"],
  ["TO", "Tonga"], ["TT", "Trinidad and Tobago"], ["TN", "Tunisia"], ["TR", "Turkey"],
  ["TM", "Turkmenistan"], ["TV", "Tuvalu"], ["UG", "Uganda"], ["UA", "Ukraine"],
  ["AE", "United Arab Emirates"], ["GB", "United Kingdom"], ["US", "United States"], ["UY", "Uruguay"],
  ["UZ", "Uzbekistan"], ["VU", "Vanuatu"], ["VA", "Vatican City"], ["VE", "Venezuela"],
  ["VN", "Vietnam"], ["YE", "Yemen"], ["ZM", "Zambia"], ["ZW", "Zimbabwe"]
];

const CODE_TO_NAME = new Map(COUNTRY_ENTRIES.map(([code, name]) => [code, name]));
const NAME_TO_CODE = new Map(
  COUNTRY_ENTRIES.flatMap(([code, name]) => {
    const entries = [[name.toLowerCase(), code]];
    // Common aliases
    if (code === "US") entries.push(["usa", code], ["united states of america", code]);
    if (code === "GB") entries.push(["uk", code], ["great britain", code], ["england", code]);
    if (code === "CI") entries.push(["ivory coast", code], ["cote d'ivoire", code], ["cote divoire", code]);
    if (code === "CZ") entries.push(["czechia", code]);
    if (code === "AE") entries.push(["uae", code]);
    if (code === "KR") entries.push(["korea", code], ["republic of korea", code]);
    if (code === "CD") entries.push(["drc", code], ["democratic republic of the congo", code]);
    if (code === "NL") entries.push(["holland", code]);
    return entries;
  })
);

function normalizeToken(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalize a free-form country input (ISO code or English name) to ISO alpha-2.
 * @returns {string|null}
 */
export function toCountryCode(value) {
  if (value === null || value === undefined || value === "") return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const upper = raw.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper) && CODE_TO_NAME.has(upper)) return upper;

  const normalized = normalizeToken(raw);
  if (NAME_TO_CODE.has(normalized)) return NAME_TO_CODE.get(normalized);

  // Accept "TN - Tunisia" / "Tunisia (TN)"
  const codeMatch = upper.match(/\b([A-Z]{2})\b/);
  if (codeMatch && CODE_TO_NAME.has(codeMatch[1])) return codeMatch[1];

  return null;
}

/**
 * Normalize a list of country codes/names into unique ISO codes.
 * @returns {string[]}
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

/**
 * Resolve effective ship-to countries for a product.
 * Product-level list wins when non-empty; otherwise supplier list; empty/null = worldwide.
 * @returns {string[]|null} null means worldwide
 */
export function resolveShipsToCountries(product, supplier = null) {
  const productCodes = normalizeCountryCodes(product?.ships_to_countries);
  if (productCodes.length) return productCodes;

  const supplierCodes = normalizeCountryCodes(supplier?.ships_to_countries);
  if (supplierCodes.length) return supplierCodes;

  return null;
}

/**
 * @returns {{ available: boolean, countryCode: string|null, shipsTo: string[]|null, shipsWorldwide: boolean }}
 */
export function checkProductAvailabilityInCountry(product, supplier, countryInput) {
  const shipsTo = resolveShipsToCountries(product, supplier);
  const countryCode = toCountryCode(countryInput?.country_code || countryInput?.countryCode || countryInput?.country || countryInput);
  const shipsWorldwide = !shipsTo || shipsTo.length === 0;

  if (shipsWorldwide) {
    return { available: true, countryCode, shipsTo: null, shipsWorldwide: true };
  }

  if (!countryCode) {
    // Restriction exists but destination unknown — not available until country is known
    return { available: false, countryCode: null, shipsTo, shipsWorldwide: false };
  }

  return {
    available: shipsTo.includes(countryCode),
    countryCode,
    shipsTo,
    shipsWorldwide: false
  };
}

export function countryName(code) {
  return CODE_TO_NAME.get(String(code || "").toUpperCase()) || code || "";
}
