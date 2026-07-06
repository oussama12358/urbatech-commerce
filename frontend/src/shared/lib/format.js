export function money(value) {
  return "$" + Number(value || 0).toLocaleString("en-US");
}

export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
