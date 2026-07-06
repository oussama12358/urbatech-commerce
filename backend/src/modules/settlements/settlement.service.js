import { createId, getCollection } from "../../db/mongo.js";

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

export async function ensureSupplierSettlementsForOrder(orderId) {
  const orders = await getCollection("orders");
  const settlements = await getCollection("supplier_settlements");
  const order = await orders.findOne({ id: orderId });
  if (!order || order.payment_status !== "paid") return [];

  const dispatches = (order.supplier_dispatches || []).filter((dispatch) => dispatch.supplier_id);
  const results = [];
  for (const dispatch of dispatches) {
    const amount = roundMoney(dispatch.supplier_payable || 0);
    if (amount <= 0) continue;

    const now = new Date();
    const doc = {
      order_id: order.id,
      supplier_id: dispatch.supplier_id,
      supplier_order_id: dispatch.supplier_order_id || null,
      amount,
      commission_total: roundMoney(dispatch.commission_total || 0),
      currency: order.currency || "USD",
      status: "pending",
      payment_method: null,
      payout_reference: null,
      created_at: now,
      updated_at: now
    };

    await settlements.updateOne(
      { order_id: order.id, supplier_id: dispatch.supplier_id },
      {
        $setOnInsert: { id: createId(), ...doc },
        $set: {
          supplier_order_id: doc.supplier_order_id,
          amount: doc.amount,
          commission_total: doc.commission_total,
          updated_at: now
        }
      },
      { upsert: true }
    );
    results.push(await settlements.findOne({ order_id: order.id, supplier_id: dispatch.supplier_id }, { projection: { _id: 0 } }));
  }

  return results;
}

export async function listSupplierSettlements({ status = null, supplierId = null } = {}) {
  const settlements = await getCollection("supplier_settlements");
  const query = {
    ...(status ? { status } : {}),
    ...(supplierId ? { supplier_id: supplierId } : {})
  };
  return settlements.find(query).project({ _id: 0 }).sort({ created_at: -1 }).limit(500).toArray();
}

export async function markSupplierSettlementPaid(id, payload = {}) {
  const settlements = await getCollection("supplier_settlements");
  const update = {
    status: payload.status || "paid",
    payment_method: payload.payment_method || "manual",
    payout_reference: payload.payout_reference || payload.reference || "",
    payout_notes: payload.notes || "",
    paid_at: payload.status === "failed" ? null : new Date(),
    updated_at: new Date()
  };
  await settlements.updateOne({ id }, { $set: update });
  return settlements.findOne({ id }, { projection: { _id: 0 } });
}

export async function summarizeSupplierSettlements() {
  const settlements = await getCollection("supplier_settlements");
  const rows = await settlements.find().toArray();
  return rows.reduce(
    (summary, item) => {
      const amount = Number(item.amount || 0);
      if (item.status === "paid") summary.paid += amount;
      else if (item.status === "failed") summary.failed += amount;
      else if (item.status === "cancelled") summary.cancelled += amount;
      else if (item.status === "held") summary.held += amount;
      else summary.pending += amount;
      return summary;
    },
    { pending: 0, paid: 0, failed: 0, held: 0, cancelled: 0 }
  );
}
