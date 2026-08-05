import { env } from "../../config/env.js";
import { createId, getCollection } from "../../db/mongo.js";
import { notifyCustomerRefundCompleted, notifyCustomerRefundInitiated } from "../notifications/notification.service.js";
import { releaseStockForItems } from "../orders/inventory.service.js";
import {
  getPaymentProviderByKey,
  getStripeClient,
  isPayPalProvider,
  isStripeProvider
} from "../payments/payment.service.js";
import { getSupplierAdapter } from "../suppliers/supplier-adapters.js";
import { minorUnitMultiplier, roundCurrency } from "../currencies/currency.service.js";

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function getPayPalConfig(provider) {
  return {
    clientId: provider?.config?.clientId || env.paypalClientId,
    clientSecret: provider?.config?.clientSecret || env.paypalClientSecret,
    mode: provider?.config?.mode || env.paypalMode || "sandbox"
  };
}

function getPayPalBase(mode) {
  return mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

async function getPayPalAccessToken(paypalConfig) {
  const paypalBase = getPayPalBase(paypalConfig.mode);
  const creds = Buffer.from(`${paypalConfig.clientId}:${paypalConfig.clientSecret}`).toString("base64");
  const tokenRes = await fetch(`${paypalBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  if (!tokenRes.ok) {
    const txt = await tokenRes.text();
    throw new Error(`Failed to get PayPal access token: ${tokenRes.status} ${txt}`);
  }
  const data = await tokenRes.json();
  return data.access_token;
}

function canAutoRestock(order) {
  const status = String(order.status || "").toLowerCase();
  return !status.includes("ship") && !status.includes("deliver");
}

function canCancelSupplierDispatch(dispatch) {
  const status = String(dispatch.status || "").toLowerCase();
  return !status.includes("ship") && !status.includes("deliver") && !status.includes("cancel");
}

async function requestSupplierCancellations(order, reason) {
  const suppliers = await getCollection("suppliers");
  const results = new Map();

  for (const dispatch of order.supplier_dispatches || []) {
    if (!dispatch.supplier_order_id || !canCancelSupplierDispatch(dispatch)) continue;
    const supplier = await suppliers.findOne({ id: dispatch.supplier_id, status: "Connected", supports_orders: true });
    if (!supplier) {
      results.set(dispatch.supplier_order_id, { cancel_status: "manual_required", cancel_error: "Supplier is not connected." });
      continue;
    }
    try {
      const adapter = getSupplierAdapter(supplier);
      const response = await adapter.cancelOrder(dispatch.supplier_order_id, { order_id: order.id, reason });
      results.set(dispatch.supplier_order_id, {
        cancel_status: response.status || "cancel_requested",
        cancel_requested_at: new Date()
      });
    } catch (err) {
      results.set(dispatch.supplier_order_id, {
        cancel_status: "manual_required",
        cancel_error: err.message,
        cancel_requested_at: new Date()
      });
    }
  }

  return results;
}

async function performGatewayRefund(order, amount) {
  const providerKey = order.payment_method || "stripe";
  const provider = await getPaymentProviderByKey(providerKey);

  if (isStripeProvider(providerKey)) {
    const stripe = getStripeClient(provider?.config || {});
    if (!stripe || !order.stripe_payment_intent) {
      return { status: "manual_required", reason: "Stripe payment intent is missing." };
    }
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent,
      amount: Math.round(amount * minorUnitMultiplier(order.currency || "USD")),
      metadata: { order_id: order.id }
    });
    return { status: "succeeded", provider_refund_id: refund.id, raw: refund };
  }

  if (isPayPalProvider(providerKey)) {
    const paypalConfig = getPayPalConfig(provider);
    if (!paypalConfig.clientId || !paypalConfig.clientSecret || !order.paypal_capture_id) {
      return { status: "manual_required", reason: "PayPal capture id or credentials are missing." };
    }
    const paypalBase = getPayPalBase(paypalConfig.mode);
    const accessToken = await getPayPalAccessToken(paypalConfig);
    const refundRes = await fetch(`${paypalBase}/v2/payments/captures/${order.paypal_capture_id}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: {
          currency_code: order.currency || "USD",
          value: String(roundCurrency(amount, order.currency || "USD"))
        }
      })
    });
    const refundData = await refundRes.json();
    if (!refundRes.ok) {
      throw new Error(refundData.message || `PayPal refund failed with ${refundRes.status}`);
    }
    return { status: "succeeded", provider_refund_id: refundData.id, raw: refundData };
  }

  return { status: "manual_required", reason: `Unsupported payment method: ${providerKey || "unknown"}` };
}

export async function refundOrder(orderId, payload = {}) {
  const orders = await getCollection("orders");
  const orderItems = await getCollection("order_items");
  const refunds = await getCollection("refunds");
  const settlements = await getCollection("supplier_settlements");
  const order = await orders.findOne({ id: orderId });
  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }
  if (order.payment_status !== "paid" && order.payment_status !== "partially_refunded") {
    const error = new Error("Only paid orders can be refunded.");
    error.status = 400;
    throw error;
  }

  const alreadyRefunded = roundMoney(order.refund_amount || 0);
  const amount = roundMoney(payload.amount || order.total);
  const remaining = roundMoney(Number(order.total || 0) - alreadyRefunded);
  if (amount <= 0 || amount > remaining) {
    const error = new Error("Invalid refund amount.");
    error.status = 400;
    throw error;
  }

  const gateway = payload.manual ? { status: "manual_required", reason: "Manual refund requested." } : await performGatewayRefund(order, amount);
  const refund = {
    id: createId(),
    order_id: order.id,
    amount,
    currency: order.currency || "USD",
    status: gateway.status,
    provider_refund_id: gateway.provider_refund_id || null,
    reason: payload.reason || gateway.reason || "",
    raw: gateway.raw || null,
    created_at: new Date()
  };
  await refunds.insertOne(refund);
  notifyCustomerRefundInitiated(order.id, refund).catch((err) => console.error("[notification:refund-initiated]", err.message));

  const nextRefundAmount = roundMoney(alreadyRefunded + (gateway.status === "succeeded" || gateway.status === "manual_required" ? amount : 0));
  const fullyRefunded = nextRefundAmount >= roundMoney(order.total || 0);
  const cancellationResults = await requestSupplierCancellations(order, payload.reason || "Customer refund");
  const dispatches = (order.supplier_dispatches || []).map((dispatch) => ({
    ...dispatch,
    refund_action: dispatch.supplier_order_id && !canCancelSupplierDispatch(dispatch) ? "return_requested" : "cancel_requested",
    ...(cancellationResults.get(dispatch.supplier_order_id) || {}),
    refund_requested_at: new Date()
  }));

  let stockReleased = false;
  if (fullyRefunded && payload.restock !== false && order.stock_reserved && !order.stock_released_at && canAutoRestock(order)) {
    const items = await orderItems.find({ order_id: order.id }).toArray();
    await releaseStockForItems(items, order.id);
    stockReleased = true;
  }

  await settlements.updateMany(
    { order_id: order.id, status: "pending" },
    { $set: { status: fullyRefunded ? "cancelled" : "held", updated_at: new Date(), refund_id: refund.id } }
  );

  await orders.updateOne(
    { id: order.id },
    {
      $set: {
        status: fullyRefunded ? (dispatches.some((item) => item.supplier_order_id) ? "Return requested" : "Refunded") : "Partially refunded",
        payment_status: fullyRefunded ? "refunded" : "partially_refunded",
        refund_status: gateway.status,
        refund_amount: nextRefundAmount,
        last_refund_id: refund.id,
        supplier_dispatches: dispatches,
        ...(stockReleased ? { stock_released_at: new Date() } : {})
      }
    }
  );

  if (gateway.status === "succeeded" || gateway.status === "manual_required") {
    notifyCustomerRefundCompleted(order.id, refund).catch((err) => console.error("[notification:refund-completed]", err.message));
  }

  return { ...refund, stock_released: stockReleased };
}

export async function listRefunds({ orderId = null } = {}) {
  const refunds = await getCollection("refunds");
  const query = orderId ? { order_id: orderId } : {};
  return refunds.find(query).project({ _id: 0, raw: 0 }).sort({ created_at: -1 }).limit(500).toArray();
}
