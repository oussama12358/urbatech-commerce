import { Router } from "express";
import { z } from "zod";
import { getCollection } from "../../db/mongo.js";
import { env } from "../../config/env.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { stripeEnabled } from "../payments/payment.service.js";

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
  const providers = await getCollection("payment_providers");
  const allProviders = await providers.find({}).project({ _id: 0, id: 1, provider_key: 1, name: 1, enabled: 1, config: 1 }).toArray();

  const stripeProvider = allProviders.find((p) => p.provider_key === "stripe");
  const paypalProvider = allProviders.find((p) => p.provider_key === "paypal");

  return {
    stripe: {
      configured: Boolean(stripeEnabled()),
      enabled: stripeProvider ? Boolean(stripeProvider.enabled) : false
    },
    paypal: {
      configured: Boolean(env.paypalClientId && env.paypalClientSecret),
      enabled: paypalProvider ? Boolean(paypalProvider.enabled) : false
    }
  };
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
