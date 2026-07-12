import { env } from "../../config/env.js";
import { createId, getCollection } from "../../db/mongo.js";
import { getPaymentProviderByKey, getStripeClient } from "../payments/payment.service.js";

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function getPayPalBase(mode) {
  return mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

async function getPayPalAccessToken(config) {
  const paypalBase = getPayPalBase(config.mode);
  const creds = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const tokenRes = await fetch(`${paypalBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`PayPal payout token failed: ${tokenRes.status} ${text}`);
  }
  const data = await tokenRes.json();
  return data.access_token;
}

async function executePayout(settlement, payload = {}) {
  const method = payload.payment_method || "manual";
  if (method === "manual" || method === "bank_transfer" || method === "wise") {
    return {
      status: payload.status || "paid",
      reference: payload.payout_reference || payload.reference || "",
      method
    };
  }

  const suppliers = await getCollection("suppliers");
  const supplier = await suppliers.findOne({ id: settlement.supplier_id });
  if (!supplier) throw new Error("Supplier not found for payout.");

  if (method === "stripe_connect") {
    const provider = await getPaymentProviderByKey("stripe");
    const stripe = getStripeClient(provider?.config || {});
    const destination = supplier.stripe_account_id || supplier.payout_stripe_account_id;
    if (!stripe || !destination) throw new Error("Stripe Connect is not configured for this supplier.");
    const transfer = await stripe.transfers.create({
      amount: Math.round(Number(settlement.amount || 0) * 100),
      currency: String(settlement.currency || "USD").toLowerCase(),
      destination,
      metadata: {
        settlement_id: settlement.id,
        order_id: settlement.order_id,
        supplier_id: settlement.supplier_id
      }
    });
    return { status: "paid", reference: transfer.id, method };
  }

  if (method === "paypal_payout") {
    const provider = await getPaymentProviderByKey("paypal");
    const config = {
      clientId: provider?.config?.clientId || env.paypalClientId,
      clientSecret: provider?.config?.clientSecret || env.paypalClientSecret,
      mode: provider?.config?.mode || env.paypalMode || "sandbox"
    };
    const receiver = supplier.payout_email || supplier.paypal_email;
    if (!config.clientId || !config.clientSecret || !receiver) throw new Error("PayPal Payouts are not configured for this supplier.");
    const paypalBase = getPayPalBase(config.mode);
    const accessToken = await getPayPalAccessToken(config);
    const payoutRes = await fetch(`${paypalBase}/v1/payments/payouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: settlement.id,
          email_subject: "URBA TECH supplier payout"
        },
        items: [
          {
            recipient_type: "EMAIL",
            receiver,
            amount: {
              value: Number(settlement.amount || 0).toFixed(2),
              currency: settlement.currency || "USD"
            },
            note: `Payout for order ${settlement.order_id}`,
            sender_item_id: settlement.id
          }
        ]
      })
    });
    const payout = await payoutRes.json();
    if (!payoutRes.ok) throw new Error(payout.message || `PayPal payout failed with ${payoutRes.status}`);
    return { status: "processing", reference: payout.batch_header?.payout_batch_id || "", method };
  }

  throw new Error(`Unsupported payout method: ${method}`);
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
        $setOnInsert: {
          id: createId(),
          order_id: doc.order_id,
          supplier_id: doc.supplier_id,
          currency: doc.currency,
          status: doc.status,
          payment_method: doc.payment_method,
          payout_reference: doc.payout_reference,
          created_at: doc.created_at
        },
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
  const settlement = await settlements.findOne({ id });
  if (!settlement) return null;
  const payout = await executePayout(settlement, payload);
  const update = {
    status: payout.status,
    payment_method: payout.method,
    payout_reference: payout.reference,
    payout_notes: payload.notes || "",
    paid_at: payout.status === "paid" ? new Date() : null,
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
