import { Router } from "express";
import { z } from "zod";
import { getCollection } from "../../db/mongo.js";
import { env } from "../../config/env.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { ensureDefaultPaymentProviders, isProviderConfigured } from "../payments/payment.service.js";

const settingsSchema = z.object({
  storefrontEnabled: z.boolean(),
  reportingCurrency: z.string().length(3).optional()
});

export const settingsRouter = Router();

async function ensureSettingsDocument() {
  const settings = await getCollection("app_settings");
  await settings.updateOne(
    { key: "storefront_enabled" },
    { $setOnInsert: { key: "storefront_enabled", value: true, updated_at: new Date() } },
    { upsert: true }
  );
}

async function getPaymentsStatus() {
  await ensureDefaultPaymentProviders();
  const providers = await getCollection("payment_providers");
  const allProviders = await providers.find({}).project({ _id: 0, id: 1, provider_key: 1, name: 1, enabled: 1, config: 1 }).toArray();
  return Object.fromEntries(allProviders.map((provider) => [provider.provider_key, {
    name: provider.name,
    configured: isProviderConfigured(provider),
    enabled: Boolean(provider.enabled)
  }]));
}

async function getSettings() {
  const settings = await getCollection("app_settings");
  const row = await settings.findOne({ key: "storefront_enabled" });
  const reportingRow = await settings.findOne({ key: "reporting_currency" });
  if (!row) {
    await ensureSettingsDocument();
    return {
      storefrontEnabled: true,
      disableEmailVerification: Boolean(env.disableEmailVerification),
      payments: await getPaymentsStatus(),
      reportingCurrency: "USD"
    };
  }
  return {
    storefrontEnabled: row.value !== false,
    disableEmailVerification: Boolean(env.disableEmailVerification),
    payments: await getPaymentsStatus(),
    reportingCurrency: String(reportingRow?.value || "USD").toUpperCase()
  };
}

settingsRouter.get("/", async (_req, res, next) => {
  try {
    res.json({ data: await getSettings() });
  } catch (err) {
    next(err);
  }
});

settingsRouter.put("/", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const payload = settingsSchema.parse(req.body);
    const settings = await getCollection("app_settings");
    await settings.updateOne(
      { key: "storefront_enabled" },
      { $set: { value: payload.storefrontEnabled, updated_at: new Date() } },
      { upsert: true }
    );
    if (payload.reportingCurrency) await settings.updateOne(
      { key: "reporting_currency" },
      { $set: { value: payload.reportingCurrency.toUpperCase(), updated_at: new Date() } },
      { upsert: true }
    );
    res.json({ data: await getSettings() });
  } catch (err) {
    next(err);
  }
});
