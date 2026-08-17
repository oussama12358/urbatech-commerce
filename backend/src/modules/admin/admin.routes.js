import { Router } from "express";
import { getAllOrders, getOrderById } from "../orders/orders.routes.js";
import { getCollection } from "../../db/mongo.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { releaseExpiredStockReservations } from "../orders/inventory.service.js";
import { notifyCustomerFulfillmentUpdate } from "../notifications/notification.service.js";
import { z } from "zod";
import { listRefunds, refundOrder } from "../refunds/refund.service.js";
import {
  ensureSupplierSettlementsForOrder,
  listSupplierSettlements,
  markSupplierSettlementPaid,
  summarizeSupplierSettlements
} from "../settlements/settlement.service.js";
import { getExchangeQuote, roundCurrency } from "../currencies/currency.service.js";
import { carrierName, carrierOptions, resolveTrackingUrl } from "../../utils/carriers.js";

export const adminRouter = Router();
const onlineSupplierStatuses = ["Connected", "Active"];

async function totalInCurrency(rows, amountForRow, targetCurrency = "USD") {
  const target = String(targetCurrency || "USD").toUpperCase();
  const quotes = await Promise.all(rows.map((row) =>
    getExchangeQuote(Number(amountForRow(row) || 0), row.currency || "USD", target)
  ));
  return roundCurrency(quotes.reduce((sum, quote) => sum + Number(quote.amount || 0), 0), target);
}

async function convertCurrencyTotals(totals = {}, targetCurrency = "USD") {
  const target = String(targetCurrency || "USD").toUpperCase();
  const quotes = await Promise.all(Object.entries(totals).map(([currency, amount]) =>
    getExchangeQuote(Number(amount || 0), currency, target)
  ));
  return { [target]: roundCurrency(quotes.reduce((sum, quote) => sum + Number(quote.amount || 0), 0), target) };
}

async function paidTotalInUsd(orders = []) {
  const paidOrders = orders.filter((order) => String(order.payment_status || "").toLowerCase() === "paid");
  const quotes = await Promise.all(paidOrders.map((order) =>
    getExchangeQuote(order.total || 0, order.currency || "USD", "USD")
  ));
  return roundCurrency(quotes.reduce((sum, quote) => sum + Number(quote.amount || 0), 0), "USD");
}

adminRouter.use(requireAuth, requireRole("admin"));

adminRouter.get("/dashboard", async (_req, res, next) => {
  try {
    const orders = await getAllOrders();
    const products = await getCollection("products");
    const suppliers = await getCollection("suppliers");
    const productsCount = await products.countDocuments({ active: true });
    const suppliersCount = await suppliers.countDocuments();
    res.json({
      data: {
        products: productsCount,
        suppliers: suppliersCount,
        orders: orders.length,
        revenue: await paidTotalInUsd(orders)
      }
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/orders", async (_req, res, next) => {
  try {
    const orders = await getAllOrders();
    res.json({ data: orders });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/orders/:id", async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.id, { includeInternal: true });
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json({ data: order });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/carriers", (_req, res) => {
  res.json({ data: carrierOptions() });
});

adminRouter.post("/orders/:id/refund", async (req, res, next) => {
  try {
    res.json({ data: await refundOrder(req.params.id, req.body || {}) });
  } catch (err) {
    next(err);
  }
});

const fulfillmentUpdateSchema = z.object({
  carrier: z.string().trim().max(120).optional(),
  carrier_code: z.string().trim().max(64).optional(),
  tracking: z.string().trim().max(180).optional(),
  tracking_url: z.string().trim().url().max(1000).optional().or(z.literal("")),
  status: z.enum(["Processing", "Shipped", "Delivered"]).optional()
});

const settlementPayoutSchema = z.object({
  payment_method: z.enum(["manual", "bank_transfer", "swift", "wise", "wise_transfer", "konnect_manual", "flouci_manual", "paymee_manual", "stripe_manual", "paypal_manual", "stripe_connect", "paypal_payout", "airwallex", "payoneer_payout"]).optional(),
  payout_reference: z.string().trim().max(180).optional(),
  notes: z.string().trim().max(1000).optional(),
  // Manual settlements normally use the locked USD amount. These two fields
  // are only supplied when the admin actually paid in another currency.
  paid_amount: z.coerce.number().positive().optional(),
  paid_currency: z.string().trim().length(3).optional(),
  payout_fee: z.coerce.number().min(0).optional(),
  payout_fee_currency: z.string().trim().length(3).optional()
});

// Used for URBA TECH stock and Excel/manual suppliers that cannot push tracking
// through an API or webhook. API suppliers can still use their automatic flow.
adminRouter.put("/orders/:id/fulfillment", async (req, res, next) => {
  try {
    const payload = fulfillmentUpdateSchema.parse(req.body || {});
    if (!payload.carrier && !payload.carrier_code && !payload.tracking && !payload.tracking_url && !payload.status) {
      res.status(400).json({ error: "Provide a carrier, tracking number, or fulfillment status." });
      return;
    }
    const orders = await getCollection("orders");
    const order = await orders.findOne({ id: req.params.id });
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const selectedCarrier = carrierName(payload.carrier_code, payload.carrier || order.carrier || "");
    const nextTracking = payload.tracking || order.tracking || "";
    const nextTrackingUrl = resolveTrackingUrl({
      carrierCode: payload.carrier_code || order.carrier_code,
      carrier: selectedCarrier,
      tracking: nextTracking,
      // An explicitly empty field means "use the carrier's normal link",
      // not "keep a link from the previously selected carrier".
      customUrl: payload.tracking_url || null
    });
    const previousStatus = order.status;
    const trackingChanged = Boolean(payload.tracking && payload.tracking !== order.tracking);
    const dispatches = Array.isArray(order.supplier_dispatches) ? [...order.supplier_dispatches] : [];
    const manualIndex = dispatches.findIndex((dispatch) => dispatch.dispatch_mode === "manual" || !dispatch.supplier_id);
    const manualDispatch = {
      ...(manualIndex >= 0 ? dispatches[manualIndex] : { supplier_id: null, supplier_order_id: `URBATECH-${order.id}`, dispatch_mode: "manual" }),
      ...(selectedCarrier ? { carrier: selectedCarrier } : {}),
      ...(payload.carrier_code ? { carrier_code: payload.carrier_code } : {}),
      ...(payload.tracking ? { tracking: payload.tracking } : {}),
      ...(nextTrackingUrl ? { tracking_url: nextTrackingUrl } : {}),
      ...(payload.status ? { status: payload.status } : {}),
      fulfilled_manually_at: new Date()
    };
    if (manualIndex >= 0) dispatches[manualIndex] = manualDispatch;
    else dispatches.push(manualDispatch);

    await orders.updateOne(
      { id: order.id },
      { $set: {
        ...(selectedCarrier ? { carrier: selectedCarrier } : {}),
        ...(payload.carrier_code ? { carrier_code: payload.carrier_code } : {}),
        ...(payload.tracking ? { tracking: payload.tracking } : {}),
        ...(nextTrackingUrl ? { tracking_url: nextTrackingUrl } : {}),
        ...(payload.status ? { status: payload.status } : {}),
        supplier_dispatches: dispatches,
        fulfillment_updated_at: new Date()
      } }
    );
    const updated = await getOrderById(order.id, { includeInternal: true });
    notifyCustomerFulfillmentUpdate(order.id, payload.status || updated.status, { previousStatus, trackingChanged })
      .catch((error) => console.error("[notification:manual-fulfillment]", error.message));
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/orders/release-expired-stock", async (req, res, next) => {
  try {
    res.json({
      data: await releaseExpiredStockReservations({
        olderThanMinutes: Number(req.body?.olderThanMinutes || 60),
        limit: Number(req.body?.limit || 100)
      })
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/orders/:id/refunds", async (req, res, next) => {
  try {
    res.json({ data: await listRefunds({ orderId: req.params.id }) });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/settlements", async (req, res, next) => {
  try {
    res.json({
      data: await listSupplierSettlements({
        status: req.query.status || null,
        supplierId: req.query.supplier_id || null
      })
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/settlements/sync/:orderId", async (req, res, next) => {
  try {
    res.json({ data: await ensureSupplierSettlementsForOrder(req.params.orderId) });
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/settlements/:id/pay", async (req, res, next) => {
  try {
    const settlement = await markSupplierSettlementPaid(req.params.id, settlementPayoutSchema.parse(req.body || {}));
    if (!settlement) {
      res.status(404).json({ error: "Settlement not found" });
      return;
    }
    res.json({ data: settlement });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/customers", async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const customers = await getCollection("customers");

    let match = { role: { $nin: ["admin", "Admin"] } };
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      match = {
        $and: [
          { role: { $nin: ["admin", "Admin"] } },
          {
            $or: [
              { name: regex },
              { email: regex },
              { phone: regex }
            ]
          }
        ]
      };
    }

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: "orders",
          let: { customerId: "$id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$customer_id", "$$customerId"] } } },
            { $project: { total: 1, currency: 1, payment_status: 1, created_at: 1 } }
          ],
          as: "orders"
        }
      },
      {
        $set: {
          orders_count: { $size: "$orders" },
          last_order_at: { $max: "$orders.created_at" }
        }
      },
      {
        $project: {
          _id: 0,
          id: 1,
          name: 1,
          email: 1,
          phone: 1,
          status: 1,
          created_at: 1,
          orders_count: 1,
          orders: 1,
          last_order_at: 1
        }
      }
    ];

    pipeline.push({ $sort: { created_at: -1, email: 1 } });

    const rows = await customers.aggregate(pipeline).toArray();
    const data = await Promise.all(rows.map(async ({ orders: customerOrders = [], ...customer }) => ({
      ...customer,
      // The platform reporting/settlement currency is USD. Only completed
      // payments count as a customer's actual spend.
      total_spent_usd: await paidTotalInUsd(customerOrders)
    })));
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/customers/:id", async (req, res, next) => {
  try {
    const customerId = req.params.id;
    const customers = await getCollection("customers");
    const customer = await customers.findOne({ id: customerId }, { projection: { _id: 0 } });
    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    const orders = await getCollection("orders");
    const orderRows = await orders
      .find({ customer_id: customerId })
      .sort({ created_at: -1 })
      .project({ _id: 0, id: 1, status: 1, payment_status: 1, total: 1, currency: 1, created_at: 1, billing: 1 })
      .toArray();

    const totalSpentUsd = await paidTotalInUsd(orderRows);
    const lastOrderAt = orderRows[0]?.created_at || null;
    const distinctAddresses = [...new Set(orderRows.map((order) => order.billing?.address).filter(Boolean))];

    res.json({
      data: {
        ...customer,
        orders_count: orderRows.length,
        total_spent_usd: totalSpentUsd,
        last_order_at: lastOrderAt,
        orders: orderRows,
        addresses: distinctAddresses
      }
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/customers/:id", async (req, res, next) => {
  try {
    const customerId = req.params.id;
    const customers = await getCollection("customers");
    const result = await customers.deleteOne({ id: customerId });
    if (!result.deletedCount) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }
    res.json({ data: { id: customerId } });
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/customers/:id/deactivate", async (req, res, next) => {
  try {
    const customerId = req.params.id;
    const customers = await getCollection("customers");
    const result = await customers.updateOne({ id: customerId }, { $set: { status: "deactivated" } });
    if (!result.matchedCount) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }
    res.json({ data: { id: customerId, status: "deactivated" } });
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/customers/:id/reactivate", async (req, res, next) => {
  try {
    const customerId = req.params.id;
    const customers = await getCollection("customers");
    const result = await customers.updateOne({ id: customerId }, { $set: { status: "active" } });
    if (!result.matchedCount) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }
    res.json({ data: { id: customerId, status: "active" } });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/reports", async (_req, res, next) => {
  try {
    const orders = await getAllOrders();
    const suppliers = await getCollection("suppliers");
    const appSettings = await getCollection("app_settings");
    const reportingSetting = await appSettings.findOne({ key: "reporting_currency" });
    const reportingCurrency = String(reportingSetting?.value || "USD").toUpperCase();
    const connectedSuppliers = await suppliers.countDocuments({ status: { $in: onlineSupplierStatuses } });
      const totalSuppliers = await suppliers.countDocuments();
      const paidOrders = orders.filter((order) => order.payment_status === "paid");
    const dispatchedOrders = orders.filter((order) => order.supplier_order_id || order.supplier_dispatches?.length);
    const settlements = await summarizeSupplierSettlements();

    res.json({
      data: {
        reporting_currency: reportingCurrency,
        connected_suppliers: connectedSuppliers,
          total_suppliers: totalSuppliers,
        total_orders: orders.length,
        paid_orders: paidOrders.length,
        supplier_dispatched_orders: dispatchedOrders.length,
        revenue_by_currency: { [reportingCurrency]: await totalInCurrency(paidOrders, (order) => order.total, reportingCurrency) },
        gross_profit_by_currency: { [reportingCurrency]: await totalInCurrency(paidOrders, (order) => order.gross_profit ?? order.platform_commission ?? order.product_commission ?? 0, reportingCurrency) },
        pending_revenue_by_currency: { [reportingCurrency]: await totalInCurrency(orders.filter((order) => order.payment_status !== "paid"), (order) => order.total, reportingCurrency) },
        supplier_payout_pending: await convertCurrencyTotals(settlements.pending, reportingCurrency),
        supplier_payout_paid: await convertCurrencyTotals(settlements.paid, reportingCurrency),
        supplier_payout_held: await convertCurrencyTotals(settlements.held, reportingCurrency),
        supplier_payout_cancelled: await convertCurrencyTotals(settlements.cancelled, reportingCurrency),
        fulfillment_rate: orders.length ? Math.round((dispatchedOrders.length / orders.length) * 100) : 0
      }
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/monitoring", async (_req, res, next) => {
  try {
    const orders = await getCollection("orders");
    const suppliers = await getCollection("suppliers");
    const dispatchJobs = await getCollection("supplier_dispatch_jobs");
    const settlements = await getCollection("supplier_settlements");
    const refunds = await getCollection("refunds");
    const notifications = await getCollection("email_notifications");

    const [
      dispatchFailed,
      dispatchPending,
      supplierOffline,
      payoutFailed,
      payoutHeld,
      refundManual,
      refundFailed,
      webhookRecentlySynced,
      emailFailed,
      emailSkipped
    ] = await Promise.all([
      dispatchJobs.countDocuments({ status: "failed" }),
      dispatchJobs.countDocuments({ status: "pending" }),
      suppliers.countDocuments({ status: { $nin: onlineSupplierStatuses } }),
      settlements.countDocuments({ status: "failed" }),
      settlements.countDocuments({ status: "held" }),
      refunds.countDocuments({ status: "manual_required" }),
      refunds.countDocuments({ status: "failed" }),
      orders.countDocuments({ supplier_status_synced_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      notifications.countDocuments({ status: "failed" }),
      notifications.countDocuments({ status: { $in: ["skipped_config", "skipped_no_recipient"] } })
    ]);

    res.json({
      data: {
        dispatch_failed: dispatchFailed,
        dispatch_pending: dispatchPending,
        suppliers_offline: supplierOffline,
        payout_failed: payoutFailed,
        payout_held: payoutHeld,
        refund_manual_required: refundManual,
        refund_failed: refundFailed,
        supplier_status_updates_24h: webhookRecentlySynced,
        email_failed: emailFailed,
        email_skipped: emailSkipped
      }
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/notifications", async (req, res, next) => {
  try {
    const notifications = await getCollection("email_notifications");
    const query = {
      ...(req.query.status ? { status: req.query.status } : {}),
      ...(req.query.type ? { type: req.query.type } : {})
    };
    const rows = await notifications
      .find(query)
      .project({ _id: 0, html: 0 })
      .sort({ created_at: -1 })
      .limit(Number(req.query.limit || 200))
      .toArray();
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});
