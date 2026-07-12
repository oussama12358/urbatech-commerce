import { Router } from "express";
import { z } from "zod";
import { getCollection, createId } from "../../db/mongo.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
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

const supplierSchema = z.object({
  company_name: z.string().min(2),
  adapter: z.enum(["universal", "generic", "cj"]).default("universal"),
  api_url: z.string().min(3),
  auth_mode: z.enum(["bearer", "api-key", "basic", "both", "oauth", "none"]).default("bearer"),
  api_key: z.string().optional().default(""),
  api_secret: z.string().optional().default(""),
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
  payout_method: z.enum(["manual", "bank_transfer", "wise", "stripe_connect", "paypal_payout"]).default("manual"),
  payout_email: z.string().optional().default(""),
  paypal_email: z.string().optional().default(""),
  stripe_account_id: z.string().optional().default(""),
  supports_products: z.boolean().default(true),
  supports_tracking: z.boolean().default(true),
  supports_orders: z.boolean().default(true),
  supports_stock: z.boolean().default(true),
  supports_prices: z.boolean().default(true)
});

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
    const supplier = {
      id: createId(),
      ...payload,
      status: "Disconnected",
      api_health: "Unknown",
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
    await suppliers.updateOne({ id: req.params.id }, { $set: { ...payload, updated_at: new Date() } });
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
    const supplier = await suppliers.findOne({ id: req.params.id });
    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }
    const deleteAction = String(req.query.deleteAction || "deactivate").toLowerCase();
    await suppliers.deleteOne({ id: req.params.id });
    if (deleteAction === "delete") {
      await products.deleteMany({ supplier_id: req.params.id });
    } else if (deleteAction === "keep") {
      await products.updateMany(
        { supplier_id: req.params.id },
        { $set: { supplier_id: null, supplier_product_id: null, auto_sync: false, updated_at: new Date() } }
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
