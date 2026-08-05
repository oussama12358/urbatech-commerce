export function money(value, currency) {
  const code = currency || localStorage.getItem("ut_currency") || "USD";
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
