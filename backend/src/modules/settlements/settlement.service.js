import { env } from "../../config/env.js";
import { createId, getCollection } from "../../db/mongo.js";
import { notifySupplierSettlementPaid } from "../notifications/notification.service.js";
import { getPaymentProviderRecordByKey, getStripeClient } from "../payments/payment.service.js";
import { getExchangeQuote, minorUnitMultiplier, normalizeCurrency, providerSupportsCurrency } from "../currencies/currency.service.js";

function roundMoney(value, currency = "USD") {
  const multiplier = minorUnitMultiplier(currency);
  return Math.round(Number(value || 0) * multiplier) / multiplier;
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
  const suppliers = await getCollection("suppliers");
  const supplier = await suppliers.findOne({ id: settlement.supplier_id });
  if (!supplier) throw new Error("Supplier not found for payout.");
  const method = payload.payment_method || settlement.payout_method || supplier.payout_method || "manual";
  const currency = normalizeCurrency(settlement.currency);
  if (["manual", "bank_transfer", "swift", "wise", "wise_transfer"].includes(method)) {
    // The transfer happens outside the application. Admin confirms it only after it was actually sent.
    return {
      status: "paid",
      reference: payload.payout_reference || payload.reference || "",
      method
    };
  }

  if (method === "stripe_connect") {
    const provider = await getPaymentProviderRecordByKey("stripe");
    const stripe = getStripeClient(provider?.config || {});
    const destination = supplier.stripe_account_id || supplier.payout_stripe_account_id;
    if (!stripe || !destination) throw new Error("Stripe Connect is not configured for this supplier.");
    if (!providerSupportsCurrency("stripe", currency, provider.config || {})) throw new Error(`Stripe Connect does not support ${currency} for this account.`);
    const transfer = await stripe.transfers.create(
      {
        amount: Math.round(Number(settlement.amount || 0) * minorUnitMultiplier(currency)),
        currency: currency.toLowerCase(),
        destination,
        metadata: {
          settlement_id: settlement.id,
          order_id: settlement.order_id,
          supplier_id: settlement.supplier_id
        }
      },
      // A retry after a network failure must never send the supplier twice.
      { idempotencyKey: `supplier-settlement:${settlement.id}` }
    );
    return { status: "paid", reference: transfer.id, method };
  }

  if (method === "paypal_payout") {
    const provider = await getPaymentProviderRecordByKey("paypal");
    const config = {
      clientId: provider?.config?.clientId || env.paypalClientId,
      clientSecret: provider?.config?.clientSecret || env.paypalClientSecret,
      mode: provider?.config?.mode || env.paypalMode || "sandbox"
    };
    const receiver = supplier.payout_email || supplier.paypal_email;
    if (!config.clientId || !config.clientSecret || !receiver) throw new Error("PayPal Payouts are not configured for this supplier.");
    if (!providerSupportsCurrency("paypal", currency, provider?.config || {})) throw new Error(`PayPal Payouts does not support ${currency} for this account.`);
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
              value: Number(settlement.amount || 0).toFixed(minorUnitMultiplier(currency) === 1 ? 0 : 2),
              currency
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

  if (["airwallex", "payoneer_payout"].includes(method)) {
    throw new Error(`${method === "airwallex" ? "Airwallex" : "Payoneer"} payouts are disabled until its verified server integration is configured.`);
  }
  throw new Error(`Unsupported payout method: ${method}`);
}

export async function ensureSupplierSettlementsForOrder(orderId) {
  const orders = await getCollection("orders");
  const settlements = await getCollection("supplier_settlements");
  const suppliers = await getCollection("suppliers");
  const order = await orders.findOne({ id: orderId });
  if (!order || order.payment_status !== "paid") return [];

  const dispatches = (order.supplier_dispatches || []).filter((dispatch) => dispatch.supplier_id);
  const results = [];
  for (const dispatch of dispatches) {
    const supplier = await suppliers.findOne({ id: dispatch.supplier_id }, { projection: { payout_method: 1, payout_currency: 1 } });
    const sourceCurrency = normalizeCurrency(order.currency);
    const currency = normalizeCurrency(supplier?.payout_currency || "USD");
    const payable = Number(dispatch.supplier_payable || 0);
    const amount = sourceCurrency === currency ? roundMoney(payable, currency) : roundMoney((await getExchangeQuote(payable, sourceCurrency, currency)).amount, currency);
    if (amount <= 0) continue;

    const now = new Date();
    const doc = {
      order_id: order.id,
      supplier_id: dispatch.supplier_id,
      supplier_order_id: dispatch.supplier_order_id || null,
      amount,
      currency,
      payout_method: supplier?.payout_method || "manual",
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
          payout_method: doc.payout_method,
          created_at: doc.created_at
        },
        $set: {
          supplier_order_id: doc.supplier_order_id,
          amount: doc.amount,
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
  const suppliers = await getCollection("suppliers");
  const query = {
    ...(status ? { status } : {}),
    ...(supplierId ? { supplier_id: supplierId } : {})
  };
  const rows = await settlements.find(query).project({ _id: 0 }).sort({ created_at: -1 }).limit(500).toArray();
  const supplierIds = [...new Set(rows.map((row) => row.supplier_id).filter(Boolean))];
  if (!supplierIds.length) return rows;
  const supplierRows = await suppliers.find({ id: { $in: supplierIds } }, { projection: { _id: 0, id: 1, payout_method: 1 } }).toArray();
  const payoutMethodBySupplier = new Map(supplierRows.map((supplier) => [supplier.id, supplier.payout_method || "manual"]));
  return rows.map((row) => ({ ...row, payout_method: row.payout_method || payoutMethodBySupplier.get(row.supplier_id) || "manual" }));
}

export async function markSupplierSettlementPaid(id, payload = {}) {
  const settlements = await getCollection("supplier_settlements");
  const payoutTransactions = await getCollection("supplier_payout_transactions");
  const settlement = await settlements.findOneAndUpdate(
    { id, status: "pending" },
    { $set: { status: "processing", updated_at: new Date() } },
    { returnDocument: "before", projection: { _id: 0 } }
  );
  if (!settlement) return null;
  const method = payload.payment_method || settlement.payout_method || "manual";
  const idempotencyKey = `supplier-settlement:${settlement.id}`;
  await payoutTransactions.updateOne(
    { settlement_id: settlement.id, idempotency_key: idempotencyKey },
    { $setOnInsert: { id: createId(), settlement_id: settlement.id, supplier_id: settlement.supplier_id, order_id: settlement.order_id, amount: settlement.amount, currency: settlement.currency, method, idempotency_key: idempotencyKey, status: "processing", created_at: new Date() }, $set: { updated_at: new Date() } },
    { upsert: true }
  );
  let payout;
  try {
    payout = await executePayout(settlement, payload);
  } catch (error) {
    await settlements.updateOne({ id, status: "processing" }, { $set: { status: "pending", updated_at: new Date() } });
    await payoutTransactions.updateOne({ settlement_id: settlement.id, idempotency_key: idempotencyKey }, { $set: { status: "failed", error: error.message, updated_at: new Date() } });
    throw error;
  }
  const update = {
    status: payout.status,
    payment_method: payout.method,
    payout_reference: payout.reference,
    payout_notes: payload.notes || "",
    paid_at: payout.status === "paid" ? new Date() : null,
    updated_at: new Date()
  };
  await settlements.updateOne({ id }, { $set: update });
  await payoutTransactions.updateOne(
    { settlement_id: settlement.id, idempotency_key: idempotencyKey },
    { $set: { status: payout.status, provider_reference: payout.reference || "", payout_fee: Number(payload.payout_fee || 0), payout_fee_currency: payload.payout_fee_currency || settlement.currency, paid_at: payout.status === "paid" ? new Date() : null, updated_at: new Date() } }
  );
  const updated = await settlements.findOne({ id }, { projection: { _id: 0 } });
  if (updated && (updated.status === "paid" || updated.status === "processing")) {
    notifySupplierSettlementPaid(updated).catch((err) => console.error("[notification:settlement-paid]", err.message));
  }
  return updated;
}

export async function summarizeSupplierSettlements() {
  const settlements = await getCollection("supplier_settlements");
  const rows = await settlements.find().toArray();
  return rows.reduce(
    (summary, item) => {
      const amount = Number(item.amount || 0);
      const currency = normalizeCurrency(item.currency || "USD");
      const bucket = item.status === "paid" ? "paid"
        : item.status === "failed" ? "failed"
          : item.status === "cancelled" ? "cancelled"
            : item.status === "held" ? "held"
              : "pending";
      summary[bucket][currency] = Number(summary[bucket][currency] || 0) + amount;
      return summary;
    },
    { pending: {}, paid: {}, failed: {}, held: {}, cancelled: {} }
  );
}
