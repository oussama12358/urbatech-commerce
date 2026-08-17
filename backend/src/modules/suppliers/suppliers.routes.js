import { Router } from "express";
import { z } from "zod";
import { getCollection, createId } from "../../db/mongo.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { importSupplierProducts, listSupplierProductImports } from "../products/product-import.service.js";
import {
  applySupplierOrderUpdate,
  dispatchSupplierOrder,
  normalizeSupplierWebhook,
  processSupplierDispatchRetries,
  publicSupplier,
  syncSupplierOrderStatuses,
  syncAllConnectedSuppliers,
  syncSupplierProducts,
  testSupplierConnection,
  verifyWebhookSignature
} from "./supplier.service.js";
import { normalizeCountryCodes } from "../../utils/shipping-countries.js";

const supplierSchema = z.object({
  company_name: z.string().min(2),
  adapter: z.enum(["universal", "generic", "cj"]).default("universal"),
  api_url: z.string().optional().default(""),
  auth_mode: z.enum(["bearer", "api-key", "basic", "both", "oauth", "none"]).default("bearer"),
  api_key: z.string().optional().default(""),
  api_secret: z.string().optional().default(""),
  notification_email: z.string().optional().default(""),
  contact_email: z.string().optional().default(""),
  api_key_header: z.string().optional().default("X-API-Key"),
  api_secret_header: z.string().optional().default("X-API-Secret"),
  custom_headers: z.record(z.any()).optional().default({}),
  webhook_secret: z.string().optional().default(""),
  webhook_signature_header: z.string().optional().default("x-supplier-signature"),
  webhook_signature_algorithm: z.enum(["plain", "hmac-sha256", "hmac-sha512"]).default("hmac-sha256"),
  endpoints: z.record(z.any()).optional().default({}),
  product_mapping: z.record(z.any()).optional().default({}),
  order_mapping: z.record(z.any()).optional().default({}),
  order_response_mapping: z.record(z.any()).optional().default({}),
  order_status_mapping: z.record(z.any()).optional().default({}),
  webhook_mapping: z.record(z.any()).optional().default({}),
  payout_method: z.enum(["manual", "bank_transfer", "swift", "wise", "wise_transfer", "konnect_manual", "flouci_manual", "paymee_manual", "stripe_manual", "paypal_manual", "stripe_connect", "paypal_payout", "airwallex", "payoneer_payout"]).default("manual"),
  payout_currency: z.string().length(3).optional().default("USD"),
  payout_backup_method: z.enum(["manual", "bank_transfer", "swift", "wise", "wise_transfer", "konnect_manual", "flouci_manual", "paymee_manual", "stripe_manual", "paypal_manual", "stripe_connect", "paypal_payout", "airwallex", "payoneer_payout"]).optional().default("manual"),
  payout_email: z.string().optional().default(""),
  paypal_email: z.string().optional().default(""),
  stripe_account_id: z.string().optional().default(""),
  payout_bank_account_holder: z.string().optional().default(""),
  payout_bank_country: z.string().optional().default(""),
  payout_bank_name: z.string().optional().default(""),
  payout_iban: z.string().optional().default(""),
  payout_swift_bic: z.string().optional().default(""),
  payout_account_number: z.string().optional().default(""),
  payout_routing_number: z.string().optional().default(""),
  wise_recipient_id: z.string().optional().default(""),
  airwallex_beneficiary_id: z.string().optional().default(""),
  payoneer_payee_id: z.string().optional().default(""),
  status: z.enum(["Active", "Inactive", "Connected", "Disconnected", "Syncing"]).optional(),
  supports_products: z.boolean().default(true),
  supports_tracking: z.boolean().default(true),
  supports_orders: z.boolean().default(true),
  supports_stock: z.boolean().default(true),
  supports_prices: z.boolean().default(true),
  // Empty array = ships worldwide. Non-empty = only these ISO country codes (e.g. ["TN","FR"]).
  ships_to_countries: z.array(z.string()).optional().default([])
});

const importProductsSchema = z.object({
  fileName: z.string().min(1),
  contentBase64: z.string().optional().default(""),
  contentText: z.string().optional().default(""),
  dryRun: z.boolean().default(true)
});

const supplierStatuses = ["Active", "Inactive", "Connected", "Disconnected", "Syncing"];

function normalizeSupplierStatus(status) {
  if (!status && status !== "") return undefined;
  const value = String(status).trim();
  return supplierStatuses.find((item) => item.toLowerCase() === value.toLowerCase()) || undefined;
}

export const suppliersRouter = Router();

suppliersRouter.post("/webhooks/:id", async (req, res, next) => {
  try {
    const suppliers = await getCollection("suppliers");
    const supplier = await suppliers.findOne({ id: req.params.id });
    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }

    const signatureHeader = supplier.webhook_signature_header || "x-supplier-signature";
    const signature = req.get(signatureHeader) || req.get("x-webhook-secret") || req.get("x-supplier-signature") || "";
    if (!verifyWebhookSignature(supplier, req.body, signature)) {
      res.status(401).json({ error: "Invalid webhook signature" });
      return;
    }

    const webhook = normalizeSupplierWebhook(supplier, req.body);
    const supplierOrderId = webhook.supplier_order_id;
    if (!supplierOrderId) {
      res.status(400).json({ error: "supplier_order_id is required" });
      return;
    }

    const result = await applySupplierOrderUpdate(webhook);
    if (!result) {
      res.status(404).json({ error: "Order not found for supplier order id" });
      return;
    }
    res.json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
});

suppliersRouter.use(requireAuth, requireRole("admin"));

suppliersRouter.get("/", async (_req, res, next) => {
  try {
    const suppliers = await getCollection("suppliers");
    const rows = await suppliers.find().sort({ company_name: 1 }).toArray();
    res.json({ data: rows.map(publicSupplier) });
  } catch (err) {
    next(err);
  }
});

suppliersRouter.post("/", async (req, res, next) => {
  try {
    const payload = supplierSchema.parse(req.body);
    const suppliers = await getCollection("suppliers");
    const existing = await suppliers.findOne({ company_name: payload.company_name });
    if (existing) {
      res.status(409).json({ error: "Supplier name already exists." });
      return;
    }
    const normalizedStatus = normalizeSupplierStatus(payload.status) || (payload.api_url ? "Connected" : "Active");
    const supplier = {
      id: createId(),
      ...payload,
      ships_to_countries: normalizeCountryCodes(payload.ships_to_countries),
      status: normalizedStatus,
      api_health: payload.api_url ? "Unknown" : "Manual",
      products_count: 0,
      orders_today: 0,
      created_at: new Date()
    };
    await suppliers.insertOne(supplier);
    res.status(201).json({ data: publicSupplier(supplier) });
  } catch (err) {
    next(err);
  }
});

suppliersRouter.put("/:id", async (req, res, next) => {
  try {
    const payload = supplierSchema.partial().parse(req.body);
    const suppliers = await getCollection("suppliers");
    if (payload.company_name) {
      const existing = await suppliers.findOne({ company_name: payload.company_name, id: { $ne: req.params.id } });
      if (existing) {
        res.status(409).json({ error: "Supplier name already exists." });
        return;
      }
    }
    const normalizedStatus = payload.status !== undefined ? normalizeSupplierStatus(payload.status) : undefined;
    if (normalizedStatus === "Inactive" || normalizedStatus === "Disconnected") {
      const products = await getCollection("products");
      await products.updateMany(
        { supplier_id: req.params.id },
        { $set: { supplier_status: "inactive", visibility: "hidden", updated_at: new Date() } }
      );
    } else if (normalizedStatus === "Active" || normalizedStatus === "Connected") {
      const products = await getCollection("products");
      await products.updateMany(
        { supplier_id: req.params.id },
        { $set: { supplier_status: "active", visibility: "visible", updated_at: new Date() } }
      );
    }

    const updateFields = { ...payload, updated_at: new Date() };
    if (payload.status !== undefined) {
      updateFields.status = normalizedStatus;
    }
    if (payload.ships_to_countries !== undefined) {
      updateFields.ships_to_countries = normalizeCountryCodes(payload.ships_to_countries);
      // Cascade supplier shipping countries to products that do not have a product-level override
      const products = await getCollection("products");
      await products.updateMany(
        {
          supplier_id: req.params.id,
          $or: [
            { ships_to_override: { $ne: true } },
            { ships_to_override: { $exists: false } }
          ]
        },
        {
          $set: {
            ships_to_countries: updateFields.ships_to_countries,
            updated_at: new Date()
          }
        }
      );
    }

    await suppliers.updateOne({ id: req.params.id }, { $set: updateFields });
    const supplier = await suppliers.findOne({ id: req.params.id });
    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }
    res.json({ data: publicSupplier(supplier) });
  } catch (err) {
    next(err);
  }
});

suppliersRouter.delete("/:id", async (req, res, next) => {
  try {
    const suppliers = await getCollection("suppliers");
    const products = await getCollection("products");
    const importBatches = await getCollection("product_import_batches");
    const supplier = await suppliers.findOne({ id: req.params.id });
    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }
    const deleteAction = String(req.query.deleteAction || "delete").toLowerCase();
    await suppliers.deleteOne({ id: req.params.id });
    await importBatches.deleteMany({ supplier_id: req.params.id });
    if (deleteAction === "delete") {
      await products.deleteMany({ supplier_id: req.params.id });
    } else if (deleteAction === "keep") {
      await products.updateMany(
        { supplier_id: req.params.id },
        { $set: { supplier_id: null, supplier_product_id: null, product_source: "internal", auto_sync: false, updated_at: new Date() } }
      );
    } else {
      await products.updateMany(
        { supplier_id: req.params.id },
        { $set: { active: false, supplier_id: null, supplier_product_id: null, auto_sync: false, updated_at: new Date() } }
      );
    }
    res.json({ data: publicSupplier(supplier) });
  } catch (err) {
    next(err);
  }
});

suppliersRouter.post("/:id/test", async (req, res, next) => {
  try {
    res.json({ data: await testSupplierConnection(req.params.id) });
  } catch (err) {
    next(err);
  }
});

suppliersRouter.post("/:id/sync", async (req, res, next) => {
  try {
    res.json({ data: await syncSupplierProducts(req.params.id) });
  } catch (err) {
    next(err);
  }
});

suppliersRouter.post("/:id/import-products", async (req, res, next) => {
  try {
    const payload = importProductsSchema.parse(req.body || {});
    res.json({
      data: await importSupplierProducts({
        supplierId: req.params.id,
        fileName: payload.fileName,
        contentBase64: payload.contentBase64,
        contentText: payload.contentText,
        dryRun: payload.dryRun
      })
    });
  } catch (err) {
    next(err);
  }
});

suppliersRouter.get("/:id/imports", async (req, res, next) => {
  try {
    res.json({
      data: await listSupplierProductImports({
        supplierId: req.params.id,
        limit: Number(req.query.limit || 20)
      })
    });
  } catch (err) {
    next(err);
  }
});

suppliersRouter.post("/sync", async (_req, res, next) => {
  try {
    res.json({ data: await syncAllConnectedSuppliers() });
  } catch (err) {
    next(err);
  }
});

suppliersRouter.post("/orders/:orderId/dispatch", async (req, res, next) => {
  try {
    res.json({ data: await dispatchSupplierOrder(req.params.orderId) });
  } catch (err) {
    next(err);
  }
});

suppliersRouter.post("/orders/retry-dispatches", async (req, res, next) => {
  try {
    res.json({ data: await processSupplierDispatchRetries({ limit: Number(req.body?.limit || 25) }) });
  } catch (err) {
    next(err);
  }
});

suppliersRouter.post("/orders/sync-statuses", async (req, res, next) => {
  try {
    res.json({ data: await syncSupplierOrderStatuses({ limit: Number(req.body?.limit || 100) }) });
  } catch (err) {
    next(err);
  }
});
