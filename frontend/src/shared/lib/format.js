export function money(value, currency) {
  // A stale browser value may contain JSON quotes (for example `"TND"`).
  // Never pass that invalid value to Intl or display it to an administrator.
  const rawCode = String(currency || localStorage.getItem("ut_currency") || "USD").trim().replace(/["']/g, "").toUpperCase();
  const code = /^[A-Z]{3}$/.test(rawCode) ? rawCode : "USD";
  try {
    // A stable locale avoids quoted ISO codes in browsers whose UI locale is RTL.
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol"
    }).format(Number(value || 0));
  } catch {
    return `${code} ${Number(value || 0).toLocaleString("en-US")}`;
  }
}

export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
