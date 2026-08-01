import { Router } from "express";
import { getAllOrders, getOrderById } from "../orders/orders.routes.js";
import { getCollection } from "../../db/mongo.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { releaseExpiredStockReservations } from "../orders/inventory.service.js";
import { listRefunds, refundOrder } from "../refunds/refund.service.js";
import {
  ensureSupplierSettlementsForOrder,
  listSupplierSettlements,
  markSupplierSettlementPaid,
  summarizeSupplierSettlements
} from "../settlements/settlement.service.js";

export const adminRouter = Router();
const onlineSupplierStatuses = ["Connected", "Active"];

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
        revenue: orders.reduce((sum, order) => sum + order.total, 0)
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

adminRouter.post("/orders/:id/refund", async (req, res, next) => {
  try {
    res.json({ data: await refundOrder(req.params.id, req.body || {}) });
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
    const settlement = await markSupplierSettlementPaid(req.params.id, req.body || {});
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
            { $project: { total: 1, created_at: 1 } }
          ],
          as: "orders"
        }
      },
      {
        $set: {
          orders_count: { $size: "$orders" },
          total_spent: { $sum: "$orders.total" },
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
          total_spent: 1,
          last_order_at: 1
        }
      }
    ];

    pipeline.push({ $sort: { created_at: -1, email: 1 } });

    const rows = await customers.aggregate(pipeline).toArray();
    res.json({ data: rows });
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
      .project({ _id: 0, id: 1, status: 1, payment_status: 1, total: 1, created_at: 1, billing: 1 })
      .toArray();

    const totalSpent = orderRows.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const lastOrderAt = orderRows[0]?.created_at || null;
    const distinctAddresses = [...new Set(orderRows.map((order) => order.billing?.address).filter(Boolean))];

    res.json({
      data: {
        ...customer,
        orders_count: orderRows.length,
        total_spent: totalSpent,
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
    const products = await getCollection("products");
    const suppliers = await getCollection("suppliers");
    const activeProducts = await products.countDocuments({ active: true });
    const connectedSuppliers = await suppliers.countDocuments({ status: { $in: onlineSupplierStatuses } });
      const totalSuppliers = await suppliers.countDocuments();
      const paidOrders = orders.filter((order) => order.payment_status === "paid");
    const dispatchedOrders = orders.filter((order) => order.supplier_order_id || order.supplier_dispatches?.length);
    const revenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
    const settlements = await summarizeSupplierSettlements();
    const pendingRevenue = orders
      .filter((order) => order.payment_status !== "paid")
      .reduce((sum, order) => sum + order.total, 0);

    res.json({
      data: {
        active_products: activeProducts,
        connected_suppliers: connectedSuppliers,
          total_suppliers: totalSuppliers,
        total_orders: orders.length,
        paid_orders: paidOrders.length,
        supplier_dispatched_orders: dispatchedOrders.length,
        revenue,
        pending_revenue: pendingRevenue,
        supplier_payout_pending: settlements.pending,
        supplier_payout_paid: settlements.paid,
        supplier_payout_held: settlements.held,
        supplier_payout_cancelled: settlements.cancelled,
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
