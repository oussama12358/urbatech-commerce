import crypto from "crypto";
import { getCollection, createId } from "../../db/mongo.js";
import {
  notifyAdminAlert,
  notifyAdminLowStock,
  notifyCustomerFulfillmentUpdate,
  notifySupplierNewOrder
} from "../notifications/notification.service.js";
import { ensureSupplierSettlementsForOrder } from "../settlements/settlement.service.js";
import { getSupplierAdapter } from "./supplier-adapters.js";
import { normalizeCountryCodes } from "../../utils/shipping-countries.js";
import { normalizeCurrency } from "../currencies/currency.service.js";

const MAX_DISPATCH_ATTEMPTS = 6;
const RETRY_BASE_DELAY_MS = 5 * 60 * 1000;

function slugify(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const onlineSupplierStatuses = ["Connected", "Active"];

function normalizeSupplierStatus(status, stock) {
  const value = String(status || "").trim().toLowerCase();
  if (value.includes("discontinued") || value.includes("deleted") || value.includes("removed") || value.includes("stopped")) {
    return "discontinued";
  }
  if (value.includes("inactive") || value.includes("disabled")) {
    return "inactive";
  }
  if (value.includes("out") || value.includes("rupture") || Number(stock || 0) <= 0) {
    return "out_of_stock";
  }
  return "active";
}

function makeDedupeKey(item, supplierId) {
  const barcode = normalizeKey(item.barcode);
  if (barcode) return `barcode:${barcode}`;
  const mpn = normalizeKey(item.mpn);
  if (mpn) return `mpn:${mpn}`;
  const sku = normalizeKey(item.supplier_product_id);
  if (sku) return `supplier-sku:${normalizeKey(supplierId)}:${sku}`;
  return `name:${slugify(item.name)}`;
}

function getPath(source, path) {
  if (!path || !source) return undefined;
  return path.split(".").reduce((value, key) => {
    if (value === undefined || value === null) return undefined;
    return value[key];
  }, source);
}

function firstValue(source, candidates, fallback) {
  const paths = String(candidates || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
  for (const path of paths) {
    const value = getPath(source, path);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}

function marginFrom(price, cost) {
  if (!price) return 0;
  return Math.round(((price - cost) / price) * 100);
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function customerFromBilling(billing = {}) {
  const firstName = billing.firstName || billing.first_name || "";
  const lastName = billing.lastName || billing.last_name || "";
  const fallbackName = `${firstName} ${lastName}`.trim();
  return {
    name: billing.customerName || billing.name || billing.fullName || fallbackName || "Customer",
    email: billing.email || "",
    phone: billing.phone || billing.phoneNumber || "",
    address: billing.address || billing.shippingAddress || billing.street || "",
    apartment: billing.apartment || billing.address2 || "",
    city: billing.city || "",
    postal_code: billing.postalCode || billing.postal_code || billing.zip || "",
    country: billing.country || "",
    notes: billing.notes || ""
  };
}

function nextRetryDate(attempts) {
  const delay = Math.min(RETRY_BASE_DELAY_MS * 2 ** Math.max(0, attempts - 1), 60 * 60 * 1000);
  return new Date(Date.now() + delay);
}

function aggregateFulfillmentStatus(dispatches, fallback = "processing") {
  const statuses = dispatches
    .map((dispatch) => String(dispatch.status || "").toLowerCase())
    .filter(Boolean);
  if (!statuses.length) return fallback;
  if (statuses.some((status) => status.includes("out for delivery") || status.includes("out_for_delivery"))) return "Out for delivery";
  if (statuses.every((status) => status.includes("delivered"))) return "Delivered";
  if (statuses.some((status) => status.includes("cancel"))) return "Cancelled";
  if (statuses.some((status) => status.includes("shipped") || status.includes("shipment"))) return "Shipped";
  if (statuses.some((status) => status.includes("prepar"))) return "Preparing";
  if (statuses.some((status) => status.includes("process"))) return "Processing";
  return dispatches[0]?.status || fallback;
}

function topLevelFulfillment(order, dispatches) {
  const firstDispatch = dispatches.find((dispatch) => dispatch.supplier_order_id) || dispatches[0] || {};
  const firstTracking = dispatches.find((dispatch) => dispatch.tracking) || {};
  const firstCarrier = dispatches.find((dispatch) => dispatch.carrier) || {};
  return {
    supplier_id: firstDispatch.supplier_id || order.supplier_id || null,
    supplier_order_id: firstDispatch.supplier_order_id || order.supplier_order_id || null,
    tracking: firstTracking.tracking || order.tracking || null,
    carrier: firstCarrier.carrier || order.carrier || null,
    status: aggregateFulfillmentStatus(dispatches, order.status)
  };
}

async function enqueueSupplierDispatchRetry({ orderId, supplierId, error }) {
  const jobs = await getCollection("supplier_dispatch_jobs");
  const existing = await jobs.findOne({ order_id: orderId, supplier_id: supplierId, status: { $in: ["pending", "failed"] } });
  const attempts = Number(existing?.attempts || 0) + 1;
  const status = attempts >= MAX_DISPATCH_ATTEMPTS ? "failed" : "pending";
  const now = new Date();
  await jobs.updateOne(
    { order_id: orderId, supplier_id: supplierId },
    {
      $set: {
        status,
        attempts,
        last_error: error?.message || String(error || "Supplier dispatch failed"),
        next_attempt_at: status === "pending" ? nextRetryDate(attempts) : null,
        updated_at: now
      },
      $setOnInsert: {
        id: createId(),
        order_id: orderId,
        supplier_id: supplierId,
        created_at: now
      }
    },
    { upsert: true }
  );
  return { attempts, status };
}

async function markSupplierDispatchRetryDone(orderId, supplierId) {
  const jobs = await getCollection("supplier_dispatch_jobs");
  await jobs.updateOne(
    { order_id: orderId, supplier_id: supplierId, status: { $in: ["pending", "failed"] } },
    { $set: { status: "done", completed_at: new Date(), updated_at: new Date() } }
  );
}

async function ensureCategoryId(name) {
  if (!name) return null;
  const categories = await getCollection("categories");
  const found = await categories.findOne({ name });
  if (found) return found.id;

  const baseSlug = slugify(name) || "category";
  let slug = baseSlug;
  let suffix = 1;
  while (await categories.findOne({ slug })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const category = { id: createId(), name, slug, created_at: new Date() };
  await categories.insertOne(category);
  return category.id;
}

export function publicSupplier(supplier) {
  if (!supplier) return null;
  return {
    id: supplier.id,
    company_name: supplier.company_name,
    adapter: supplier.adapter || "universal",
    api_url: supplier.api_url,
    auth_mode: supplier.auth_mode || "bearer",
    notification_email: supplier.notification_email || "",
    contact_email: supplier.contact_email || "",
    api_key_header: supplier.api_key_header || "X-API-Key",
    api_secret_header: supplier.api_secret_header || "X-API-Secret",
    custom_headers: supplier.custom_headers || {},
    endpoints: supplier.endpoints || {},
    product_mapping: supplier.product_mapping || {},
    order_mapping: supplier.order_mapping || {},
    order_response_mapping: supplier.order_response_mapping || {},
    order_status_mapping: supplier.order_status_mapping || {},
    webhook_mapping: supplier.webhook_mapping || {},
    payout_method: supplier.payout_method || "manual",
    payout_currency: supplier.payout_currency || "USD",
    payout_email: supplier.payout_email || "",
    paypal_email: supplier.paypal_email || "",
    stripe_account_id: supplier.stripe_account_id || "",
    status: supplier.status || "Disconnected",
    api_health: supplier.api_health || "Unknown",
    supports_products: Boolean(supplier.supports_products),
    supports_tracking: Boolean(supplier.supports_tracking),
    supports_orders: Boolean(supplier.supports_orders),
    supports_stock: Boolean(supplier.supports_stock),
    supports_prices: Boolean(supplier.supports_prices),
    // Empty = ships worldwide
    ships_to_countries: Array.isArray(supplier.ships_to_countries) ? supplier.ships_to_countries : [],
    last_sync_at: supplier.last_sync_at || null,
    products_count: supplier.products_count || 0,
    orders_today: supplier.orders_today || 0,
    created_at: supplier.created_at
  };
}

export async function testSupplierConnection(id) {
  const suppliers = await getCollection("suppliers");
  const supplier = await suppliers.findOne({ id });
  if (!supplier) throw new Error("Supplier not found");

  const adapter = getSupplierAdapter(supplier);
  const result = await adapter.testConnection();
  const update = {
    status: result.ok ? "Connected" : "Disconnected",
    api_health: result.api_health || (result.ok ? "Online" : "Offline"),
    last_connection_test_at: new Date()
  };
  await suppliers.updateOne({ id }, { $set: update });
  return publicSupplier({ ...supplier, ...update });
}

export async function syncSupplierProducts(id) {
  const suppliers = await getCollection("suppliers");
  const products = await getCollection("products");
  const supplier = await suppliers.findOne({ id });
  if (!supplier) throw new Error("Supplier not found");

  const adapter = getSupplierAdapter(supplier);
  const supplierProducts = await adapter.syncProducts();
  let updated = 0;
  const syncAt = new Date();

  const supplierShipsTo = normalizeCountryCodes(supplier.ships_to_countries);

  for (const item of supplierProducts) {
    if (!item.supplier_product_id) continue;
    const categoryId = await ensureCategoryId(item.category);
    const price = Number(item.price || 0);
    const costPrice = Number(item.cost_price || price);
    const stock = Number(item.stock || 0);
    const margin = marginFrom(price, costPrice);
    const productId = `${slugify(item.name) || "supplier-product"}-${String(id).slice(0, 8)}-${item.supplier_product_id}`.slice(0, 90);
    const supplierStatus = normalizeSupplierStatus(item.status, stock);
    const productShipsTo = normalizeCountryCodes(item.ships_to_countries);
    const shipsToOverride = productShipsTo.length > 0;
    const shipsToCountries = shipsToOverride ? productShipsTo : supplierShipsTo;
    await products.updateOne(
      { supplier_id: id, supplier_product_id: item.supplier_product_id },
      {
        $set: {
          supplier_id: id,
          supplier_product_id: item.supplier_product_id,
          product_source: "api",
          sku: item.sku || item.supplier_product_id,
          category_id: categoryId,
          name: item.name,
          description: item.description || "",
          price,
          base_price: price,
          base_currency: normalizeCurrency(item.currency || "USD"),
          cost_price: costPrice,
          margin,
          stock,
          status: item.status || "In stock",
          supplier_status: supplierStatus,
          supplier_last_sync_at: syncAt,
          brand: item.brand || null,
          manufacturer: item.manufacturer || item.brand || null,
          mpn: item.mpn || null,
          barcode: item.barcode || null,
          dedupe_key: makeDedupeKey(item, id),
          images: item.images || [],
          specs: item.specs || [],
          ships_to_countries: shipsToCountries,
          ships_to_override: shipsToOverride,
          auto_sync: true,
          active: true,
          updated_at: new Date()
        },
        $setOnInsert: {
          id: productId,
          created_at: new Date()
        }
      },
      { upsert: true }
    );
    notifyAdminLowStock({
      id: productId,
      name: item.name,
      stock,
      supplier_id: id
    }).catch((err) => console.error("[notification:low-stock]", err.message));
    updated += 1;
  }

  const productsCount = await products.countDocuments({ supplier_id: id, active: true });
  const update = {
    status: "Connected",
    api_health: "Online",
    last_sync_at: new Date(),
    products_count: productsCount
  };
  await suppliers.updateOne({ id }, { $set: update });
  return { updated, supplier: publicSupplier({ ...supplier, ...update }) };
}

export async function syncAllConnectedSuppliers() {
  const suppliers = await getCollection("suppliers");
  const rows = await suppliers.find({ status: { $in: onlineSupplierStatuses }, supports_products: true }).toArray();
  const results = [];
  for (const supplier of rows) {
    try {
      results.push({ supplier_id: supplier.id, ...(await syncSupplierProducts(supplier.id)) });
    } catch (err) {
      await suppliers.updateOne({ id: supplier.id }, { $set: { api_health: "Offline", last_sync_error: err.message } });
      notifyAdminAlert({
        subject: `Supplier API failed: ${supplier.company_name || supplier.id}`,
        subjectKey: "supplierApiFailedWithStatus",
        subjectParams: { code: err.status || "unknown", supplier: supplier.company_name || supplier.id },
        type: "admin_supplier_api_failed",
        message: err.message,
        entity: { supplier_id: supplier.id, company_name: supplier.company_name, action: "product_sync", error_status: err.status || null },
        dedupeKey: `admin_supplier_api_failed:sync:${supplier.id}:${err.message}`
      }).catch((notifyErr) => console.error("[notification:supplier-api-failed]", notifyErr.message));
      results.push({ supplier_id: supplier.id, error: err.message });
    }
  }
  return results;
}

export async function dispatchSupplierOrder(orderId, { onlySupplierId = null } = {}) {
  const orders = await getCollection("orders");
  const orderItems = await getCollection("order_items");
  const products = await getCollection("products");
  const suppliers = await getCollection("suppliers");

  const order = await orders.findOne({ id: orderId });
  if (!order) throw new Error("Order not found");
  if (String(order.payment_status || "").toLowerCase() !== "paid") {
    const error = new Error("Supplier dispatch is allowed only after the customer payment is confirmed.");
    error.status = 409;
    throw error;
  }

  const items = await orderItems.find({ order_id: orderId }).toArray();
  const grouped = new Map();
  for (const item of items) {
    let supplierId = item.supplier_id;
    let supplierProductId = item.supplier_product_id;
    let costPrice = item.cost_price;

    if (!supplierId || !supplierProductId) {
      const product = await products.findOne({ id: item.product_id, active: true });
      supplierId = supplierId || product?.supplier_id;
      supplierProductId = supplierProductId || product?.supplier_product_id;
      costPrice = costPrice ?? product?.cost_price;
    }

    if (!supplierId || !supplierProductId) continue;
    if (!grouped.has(supplierId)) grouped.set(supplierId, []);

    const quantity = Number(item.quantity || 0);
    const unitPrice = roundMoney(item.unit_price);
    const cost = roundMoney(costPrice ?? unitPrice);
    const supplierTotal = roundMoney((item.supplier_total ?? cost * quantity));
    const lineTotal = roundMoney(item.total ?? unitPrice * quantity);
    const grossProfit = roundMoney(item.gross_profit ?? item.commission ?? (lineTotal - supplierTotal));

    grouped.get(supplierId).push({
      product_id: supplierProductId,
      local_product_id: item.product_id,
      name: item.name || item.product_id,
      quantity: item.quantity,
      unit_price: unitPrice,
      cost_price: cost,
      supplier_total: supplierTotal,
      gross_profit: grossProfit
    });
  }

  const dispatches = [];
  const failures = [];
  const existingDispatches = Array.isArray(order.supplier_dispatches) ? order.supplier_dispatches : [];
  const previousFulfillment = topLevelFulfillment(order, existingDispatches);
  const successfulSupplierIds = new Set(
    existingDispatches.filter((dispatch) => dispatch.supplier_order_id).map((dispatch) => dispatch.supplier_id)
  );
  const customer = customerFromBilling(order.billing || {});
  for (const [supplierId, supplierItems] of grouped.entries()) {
    if (onlySupplierId && supplierId !== onlySupplierId) continue;
    if (successfulSupplierIds.has(supplierId)) continue;

    const supplier = await suppliers.findOne({ id: supplierId });
    if (!supplier) {
      const error = new Error("Supplier not found for dispatch");
      const retry = await enqueueSupplierDispatchRetry({ orderId: order.id, supplierId, error });
      notifyAdminAlert({
        subject: `Dispatch failed for order ${order.id}`,
        type: "admin_dispatch_failed",
        message: error.message,
        entity: { order_id: order.id, supplier_id: supplierId, attempts: retry.attempts, status: retry.status },
        dedupeKey: `admin_dispatch_failed:${order.id}:${supplierId}:${retry.attempts}`
      }).catch((notifyErr) => console.error("[notification:dispatch-failed]", notifyErr.message));
      failures.push({ supplier_id: supplierId, status: retry.status, attempts: retry.attempts, error: error.message });
      continue;
    }
    const supplierSubtotal = roundMoney(supplierItems.reduce((sum, item) => sum + Number(item.supplier_total || 0), 0));
    if (!supplier.api_url || !supplier.supports_orders || !onlineSupplierStatuses.includes(supplier.status)) {
      const manualDispatch = {
        supplier_id: supplierId,
        supplier_order_id: `MANUAL-${order.id}-${String(supplierId).slice(0, 8)}`,
        supplier_payable: supplierSubtotal,
        status: "Manual fulfillment pending",
        dispatch_mode: "manual",
        dispatched_at: new Date()
      };
      dispatches.push(manualDispatch);
      notifySupplierNewOrder(order.id, supplierId, manualDispatch).catch((notifyErr) => console.error("[notification:supplier-new-order]", notifyErr.message));
      await suppliers.updateOne({ id: supplierId }, { $inc: { orders_today: 1 } });
      continue;
    }

    const adapter = getSupplierAdapter(supplier);
    try {
      const supplierInvoiceItems = supplierItems.map((item) => ({
        product_id: item.product_id,
        local_product_id: item.local_product_id,
        name: item.name,
        quantity: item.quantity,
        supplier_total: item.supplier_total
      }));
      const response = await adapter.createOrder({
        order_id: order.id,
        items: supplierItems,
        customer,
        billing: order.billing || {},
        invoice: {
          type: "supplier_purchase_order",
          platform: "URBA TECH INTER",
          order_id: order.id,
          supplier_id: supplierId,
          currency: order.currency || "USD",
          customer,
          items: supplierInvoiceItems,
          supplier_subtotal: supplierSubtotal,
          supplier_payable: supplierSubtotal
        }
      });
      dispatches.push({
        supplier_id: supplierId,
        supplier_payable: supplierSubtotal,
        dispatched_at: new Date(),
        ...response
      });
      notifySupplierNewOrder(order.id, supplierId, {
        supplier_id: supplierId,
        supplier_payable: supplierSubtotal,
        ...response
      }).catch((notifyErr) => console.error("[notification:supplier-new-order]", notifyErr.message));
      await markSupplierDispatchRetryDone(order.id, supplierId);
      await suppliers.updateOne({ id: supplierId }, { $inc: { orders_today: 1 } });
    } catch (err) {
      const retry = await enqueueSupplierDispatchRetry({ orderId: order.id, supplierId, error: err });
      notifyAdminAlert({
        subject: `Dispatch failed for order ${order.id}`,
        type: "admin_dispatch_failed",
        message: err.message,
        entity: { order_id: order.id, supplier_id: supplierId, attempts: retry.attempts, status: retry.status },
        dedupeKey: `admin_dispatch_failed:${order.id}:${supplierId}:${retry.attempts}`
      }).catch((notifyErr) => console.error("[notification:dispatch-failed]", notifyErr.message));
      failures.push({ supplier_id: supplierId, status: retry.status, attempts: retry.attempts, error: err.message });
    }
  }

  if (dispatches.length || failures.length) {
    const newSupplierIds = new Set(dispatches.map((dispatch) => dispatch.supplier_id));
    const combinedDispatches = [
      ...existingDispatches.filter((dispatch) => !newSupplierIds.has(dispatch.supplier_id)),
      ...dispatches
    ];
    const fulfillment = topLevelFulfillment(order, combinedDispatches);
    const allSupplierIds = [...grouped.keys()];
    const allDispatched = allSupplierIds.every((supplierId) =>
      combinedDispatches.some((dispatch) => dispatch.supplier_id === supplierId && dispatch.supplier_order_id)
    );

    await orders.updateOne(
      { id: orderId },
      {
        $set: {
          ...fulfillment,
          status: combinedDispatches.length ? fulfillment.status : "Supplier dispatch pending",
          supplier_dispatches: combinedDispatches,
          supplier_dispatch_failures: failures,
          supplier_dispatch_error: failures.length ? failures.map((failure) => failure.error).join("; ") : null,
          ...(allDispatched ? { supplier_dispatched_at: new Date() } : {})
        }
      }
    );
    notifyCustomerFulfillmentUpdate(order.id, fulfillment.status, {
      previousStatus: previousFulfillment.status,
      trackingChanged: Boolean(fulfillment.tracking && fulfillment.tracking !== previousFulfillment.tracking)
    }).catch((err) => console.error("[notification:fulfillment]", err.message));
    if (combinedDispatches.length) {
      await ensureSupplierSettlementsForOrder(orderId);
    }
    return { dispatches: combinedDispatches, failures };
  }

  return { dispatches: existingDispatches, failures };
}

export async function processSupplierDispatchRetries({ limit = 25 } = {}) {
  const jobs = await getCollection("supplier_dispatch_jobs");
  const now = new Date();
  const rows = await jobs
    .find({ status: "pending", next_attempt_at: { $lte: now } })
    .sort({ next_attempt_at: 1, created_at: 1 })
    .limit(limit)
    .toArray();

  const results = [];
  for (const job of rows) {
    try {
      const result = await dispatchSupplierOrder(job.order_id, { onlySupplierId: job.supplier_id });
      results.push({ order_id: job.order_id, supplier_id: job.supplier_id, ...result });
    } catch (err) {
      const retry = await enqueueSupplierDispatchRetry({
        orderId: job.order_id,
        supplierId: job.supplier_id,
        error: err
      });
      results.push({ order_id: job.order_id, supplier_id: job.supplier_id, error: err.message, ...retry });
    }
  }

  return { processed: rows.length, results };
}

export async function applySupplierOrderUpdate({ supplierOrderId, supplier_order_id, status, tracking, carrier, invoice_number, invoice_url }) {
  const orders = await getCollection("orders");
  const lookupOrderId = supplierOrderId || supplier_order_id;
  const order = await orders.findOne({
    $or: [{ supplier_order_id: lookupOrderId }, { "supplier_dispatches.supplier_order_id": lookupOrderId }]
  });
  if (!order) return null;
  const previousFulfillment = topLevelFulfillment(order, order.supplier_dispatches || []);

  let matchedDispatch = false;
  let dispatches = (order.supplier_dispatches || []).map((dispatch) => {
    if (dispatch.supplier_order_id !== lookupOrderId) return dispatch;
    matchedDispatch = true;
    return {
      ...dispatch,
      ...(status ? { status } : {}),
      ...(tracking ? { tracking } : {}),
      ...(carrier ? { carrier } : {}),
      ...(invoice_number ? { invoice_number } : {}),
      ...(invoice_url ? { invoice_url } : {}),
      supplier_status_synced_at: new Date()
    };
  });
  if (!matchedDispatch && order.supplier_order_id === lookupOrderId) {
    dispatches = [
      {
        supplier_id: order.supplier_id || null,
        supplier_order_id: lookupOrderId,
        ...(status ? { status } : {}),
        ...(tracking ? { tracking } : {}),
        ...(carrier ? { carrier } : {}),
        ...(invoice_number ? { invoice_number } : {}),
        ...(invoice_url ? { invoice_url } : {}),
        supplier_status_synced_at: new Date()
      }
    ];
  }
  const fulfillment = topLevelFulfillment(order, dispatches);
  const trackingChanged = Boolean(fulfillment.tracking && fulfillment.tracking !== previousFulfillment.tracking);

  await orders.updateOne(
    { id: order.id },
    {
      $set: {
        ...fulfillment,
        supplier_dispatches: dispatches,
        supplier_status_synced_at: new Date()
      }
    }
  );
  notifyCustomerFulfillmentUpdate(order.id, fulfillment.status, {
    previousStatus: previousFulfillment.status,
    trackingChanged
  }).catch((err) => console.error("[notification:fulfillment]", err.message));
  return { order_id: order.id, dispatches };
}

export async function syncSupplierOrderStatuses({ limit = 100 } = {}) {
  const orders = await getCollection("orders");
  const suppliers = await getCollection("suppliers");
  const rows = await orders
    .find({ supplier_dispatches: { $elemMatch: { supplier_order_id: { $exists: true, $ne: null } } } })
    .sort({ paid_at: -1, created_at: -1 })
    .limit(limit)
    .toArray();

  const results = [];
  for (const order of rows) {
    for (const dispatch of order.supplier_dispatches || []) {
      if (!dispatch.supplier_order_id) continue;
      const supplier = await suppliers.findOne({ id: dispatch.supplier_id, status: { $in: onlineSupplierStatuses }, supports_tracking: true });
      if (!supplier) continue;
      try {
        const adapter = getSupplierAdapter(supplier);
        const update = await adapter.getOrderStatus(dispatch.supplier_order_id);
        const applied = await applySupplierOrderUpdate({ supplierOrderId: dispatch.supplier_order_id, ...update });
        results.push({ order_id: order.id, supplier_id: dispatch.supplier_id, supplier_order_id: dispatch.supplier_order_id, ...update, applied: Boolean(applied) });
      } catch (err) {
        notifyAdminAlert({
          subject: `Supplier API failed: ${supplier.company_name || supplier.id}`,
          subjectKey: "supplierApiFailedWithStatus",
          subjectParams: { code: err.status || "unknown", supplier: supplier.company_name || supplier.id },
          type: "admin_supplier_api_failed",
          message: err.message,
          entity: {
            supplier_id: supplier.id,
            company_name: supplier.company_name,
            order_id: order.id,
            supplier_order_id: dispatch.supplier_order_id,
            action: "status_sync",
            error_status: err.status || null
          },
          dedupeKey: `admin_supplier_api_failed:status:${supplier.id}:${dispatch.supplier_order_id}:${err.message}`
        }).catch((notifyErr) => console.error("[notification:supplier-api-failed]", notifyErr.message));
        results.push({ order_id: order.id, supplier_id: dispatch.supplier_id, supplier_order_id: dispatch.supplier_order_id, error: err.message });
      }
    }
  }

  return { checked: rows.length, results };
}

export function verifyWebhookSignature(supplier, payload, signature) {
  if (!supplier.webhook_secret) return false;
  const algorithm = supplier.webhook_signature_algorithm || "hmac-sha256";
  if (algorithm === "plain") return signature === supplier.webhook_secret;
  if (signature === supplier.webhook_secret) return true;
  const digest = algorithm === "hmac-sha512" ? "sha512" : "sha256";
  const expected = crypto.createHmac(digest, supplier.webhook_secret).update(JSON.stringify(payload)).digest("hex");
  return signature === expected || signature === `${digest}=${expected}`;
}

export function normalizeSupplierWebhook(supplier, payload) {
  const mapping = {
    supplier_order_id: "supplier_order_id|order_id|id",
    status: "status|order_status",
    tracking: "tracking|tracking_number|trackingCode",
    carrier: "carrier|shipping_carrier",
    invoice_number: "invoice_number|invoiceNumber|invoice.id",
    invoice_url: "invoice_url|invoiceUrl|invoice.url|invoice.pdf_url",
    ...(supplier.webhook_mapping || {})
  };
  return {
    supplier_order_id: firstValue(payload, mapping.supplier_order_id, null),
    status: firstValue(payload, mapping.status, null),
    tracking: firstValue(payload, mapping.tracking, null),
    carrier: firstValue(payload, mapping.carrier, null),
    invoice_number: firstValue(payload, mapping.invoice_number, null),
    invoice_url: firstValue(payload, mapping.invoice_url, null)
  };
}
