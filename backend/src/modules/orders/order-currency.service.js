import { getCollection } from "../../db/mongo.js";
import { normalizeCurrency } from "../currencies/currency.service.js";

// The order currency is an application setting.  It is intentionally not
// derived from a browser display preference, shipping country, or card.
// Older installations already use reporting_currency as their configured
// default, so keep that behaviour unless an explicit order_currency exists.
export function resolveConfiguredOrderCurrency({ orderCurrency, reportingCurrency } = {}) {
  return normalizeCurrency(orderCurrency || reportingCurrency || "USD");
}

export async function getConfiguredOrderCurrency() {
  const settings = await getCollection("app_settings");
  const orderRow = await settings.findOne({ key: "order_currency" });
  if (orderRow?.value) return resolveConfiguredOrderCurrency({ orderCurrency: orderRow.value });

  // One-time backward-compatible bootstrap only. Historically the project
  // had no distinct order-currency record, so use the existing configured
  // reporting value once and persist it. Later reporting changes must never
  // silently alter checkout/payment currency.
  const reportingRow = await settings.findOne({ key: "reporting_currency" });
  const initialCurrency = resolveConfiguredOrderCurrency({ reportingCurrency: reportingRow?.value });
  await settings.updateOne(
    { key: "order_currency" },
    { $setOnInsert: { key: "order_currency", value: initialCurrency, updated_at: new Date() } },
    { upsert: true }
  );
  return initialCurrency;
}
