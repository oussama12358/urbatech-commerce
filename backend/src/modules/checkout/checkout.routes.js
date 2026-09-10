import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { requireAuth } from "../../middleware/auth.js";
import { createId, getCollection } from "../../db/mongo.js";
import { dispatchSupplierOrder } from "../suppliers/supplier.service.js";
import { processAutomaticSupplierPayoutsForOrder } from "../settlements/settlement.service.js";
import { getOrderById } from "../orders/orders.routes.js";
import { notifyCustomerPaymentReceived } from "../notifications/notification.service.js";
import {
  getPaymentProviderRecordByKey,
  getStripeClient,
  isFlouciProvider,
  isKonnectProvider,
  isPayPalProvider,
  isPaymeeProvider,
  isRedirectPaymentProvider,
  isStripeProvider
} from "../payments/payment.service.js";
import {
  createFlouciPayment,
  createKonnectPayment,
  createPaymeePayment,
  paymeePaymentSucceeded,
  verifyFlouciPayment,
  verifyKonnectPayment,
  verifyPaymeeChecksum
} from "../payments/local-payment.service.js";
import { minorUnitMultiplier, roundCurrency } from "../currencies/currency.service.js";

export const checkoutRouter = Router();

function getPayPalConfig(provider) {
  return {
    clientId: provider?.config?.clientId || env.paypalClientId,
    clientSecret: provider?.config?.clientSecret || env.paypalClientSecret,
    mode: provider?.config?.mode || env.paypalMode || "sandbox",
    webhookId: provider?.config?.webhookId || env.paypalWebhookId
  };
}

async function recordPaymentTransaction({ order, providerKey, status = "pending", providerPaymentId = null, methodCode = null, metadata = {} }) {
  const transactions = await getCollection("payment_transactions");
  const now = new Date();
  await transactions.updateOne(
    { order_id: order.id, provider_key: providerKey },
    { $setOnInsert: { id: createId(), order_id: order.id, customer_id: order.customer_id, provider_key: providerKey, created_at: now },
      $set: { status, amount: Number(order.total || 0), currency: String(order.currency || "USD").toUpperCase(), method_code: methodCode || providerKey, provider_payment_id: providerPaymentId, metadata, updated_at: now } },
    { upsert: true }
  );
}

async function markTransactionPaid({ order, providerKey, providerPaymentId, metadata = {} }) {
  const transactions = await getCollection("payment_transactions");
  await transactions.updateOne(
    { order_id: order.id, provider_key: providerKey },
    { $set: { status: "paid", provider_payment_id: providerPaymentId || null, paid_at: new Date(), metadata, updated_at: new Date() } },
    { upsert: true }
  );
}

async function completePaidOrder(order, providerKey, providerPaymentId, fields = {}) {
  const orders = await getCollection("orders");
  const current = await orders.findOne({ id: order.id });
  if (!current || current.payment_status === "paid") return;
  await orders.updateOne({ id: order.id }, { $set: { status: "Paid", payment_status: "paid", paid_at: new Date(), ...fields } });
  await markTransactionPaid({ order, providerKey, providerPaymentId, metadata: fields });
  notifyCustomerPaymentReceived(order.id).catch((err) => console.error("[notification:payment-received]", err.message));
  await dispatchSupplierOrder(order.id).catch(async (err) => {
    await orders.updateOne({ id: order.id }, { $set: { supplier_dispatch_error: err.message } });
  });
  const payoutResults = await processAutomaticSupplierPayoutsForOrder(order.id);
  const payoutFailures = payoutResults.filter((result) => result.error);
  if (payoutFailures.length) {
    await orders.updateOne(
      { id: order.id },
      { $set: { supplier_payout_error: payoutFailures.map((result) => result.error).join(" | ") } }
    );
  }
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

function getPayPalCaptureId(payload) {
  return (
    payload?.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
    payload?.resource?.id ||
    null
  );
}

checkoutRouter.post("/session", requireAuth, async (req, res, next) => {
  try {
    const bodySchema = z.object({ order_id: z.string(), provider_key: z.string().default("stripe") });
    const payload = bodySchema.parse(req.body);
    const order = await getOrderById(payload.order_id);
    if (!order || order.customer_id !== req.user.id) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const provider = await getPaymentProviderRecordByKey(payload.provider_key);
    if (!provider || !provider.enabled || !isRedirectPaymentProvider(provider)) {
      res.status(400).json({ error: "Selected payment method is unavailable." });
      return;
    }

    const currency = String(order.currency || "USD").toUpperCase();
    const multiplier = minorUnitMultiplier(currency);
    const lineItems = order.items.map((item) => ({
      quantity: item.qty,
      price_data: {
        currency: currency.toLowerCase(),
        unit_amount: Math.round(item.unit_price * multiplier),
        product_data: { name: item.name || item.product_id }
      }
    }));
    if (order.service_fee) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: Math.round(order.service_fee * multiplier),
          product_data: { name: "Service fee" }
        }
      });
    }
    if (order.shipping) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: Math.round(order.shipping * multiplier),
          product_data: { name: "Shipping" }
        }
      });
    }

    const orders = await getCollection("orders");
    const updateFields = {
      payment_method: provider.provider_key,
      payment_status: "pending",
      status: "Payment pending"
    };

    if (isStripeProvider(provider.provider_key)) {
      const stripe = getStripeClient(provider.config || {});
      if (!stripe) {
        res.status(501).json({ error: "Stripe is not configured yet." });
        return;
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: lineItems,
        client_reference_id: order.id,
        customer_email: order.billing?.customerEmail || order.billing?.email || undefined,
        metadata: {
          order_id: order.id,
          customer_id: req.user.id,
          provider_key: provider.provider_key
        },
        success_url: `${env.clientOrigin}/orders/${order.id}?payment=success`,
        cancel_url: `${env.clientOrigin}/checkout?payment=cancelled&order=${order.id}`
      });

      await orders.updateOne(
        { id: order.id },
        {
          $set: {
            ...updateFields,
            stripe_session_id: session.id
          }
        }
      );
      await recordPaymentTransaction({ order, providerKey: provider.provider_key, providerPaymentId: session.id, metadata: { session_id: session.id } });
      res.json({ url: session.url });
      return;
    }

    if (isPayPalProvider(provider.provider_key)) {
      const paypalConfig = getPayPalConfig(provider);
      if (!paypalConfig.clientId || !paypalConfig.clientSecret) {
        res.status(501).json({ error: "PayPal is not configured on the server." });
        return;
      }

      try {
        const paypalBase = getPayPalBase(paypalConfig.mode);
        const accessToken = await getPayPalAccessToken(paypalConfig);
        const createRes = await fetch(`${paypalBase}/v2/checkout/orders`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [
              {
                amount: {
                  currency_code: currency,
                  value: String(roundCurrency(order.total, currency))
                }
              }
            ],
            application_context: {
              return_url: `${env.apiOrigin}/api/checkout/paypal/return?order_id=${order.id}`,
              cancel_url: `${env.clientOrigin}/checkout?payment=cancelled&order=${order.id}`
            }
          })
        });

        if (!createRes.ok) {
          const txt = await createRes.text();
          throw new Error(`PayPal create order failed: ${createRes.status} ${txt}`);
        }
        const createData = await createRes.json();
        const approveLink = (createData.links || []).find((l) => l.rel === "approve")?.href;
        if (!approveLink) {
          throw new Error("PayPal did not return an approval link.");
        }

        await orders.updateOne({ id: order.id }, { $set: { ...updateFields, paypal_order_id: createData.id } });
        await recordPaymentTransaction({ order, providerKey: provider.provider_key, providerPaymentId: createData.id, metadata: { paypal_order_id: createData.id } });
        res.json({ url: approveLink });
        return;
      } catch (err) {
        next(err);
        return;
      }
    }

    if (isKonnectProvider(provider.provider_key) || isPaymeeProvider(provider.provider_key) || isFlouciProvider(provider.provider_key)) {
      let payment;
      if (isKonnectProvider(provider.provider_key)) payment = await createKonnectPayment(order);
      if (isPaymeeProvider(provider.provider_key)) payment = await createPaymeePayment(order);
      if (isFlouciProvider(provider.provider_key)) payment = await createFlouciPayment(order);

      await orders.updateOne(
        { id: order.id },
        { $set: { ...updateFields, [`${provider.provider_key}_payment_id`]: payment.providerPaymentId } }
      );
      await recordPaymentTransaction({
        order,
        providerKey: provider.provider_key,
        providerPaymentId: payment.providerPaymentId,
        metadata: payment.metadata
      });
      res.json({ url: payment.url });
      return;
    }

    res.status(400).json({ error: "This payment method does not support direct online payment." });
  } catch (err) {
    next(err);
  }
});

async function findOrderForProviderPayment(providerKey, providerPaymentId, fallbackOrderId = null) {
  const orders = await getCollection("orders");
  if (fallbackOrderId) {
    const byId = await orders.findOne({ id: fallbackOrderId });
    if (byId && byId.payment_method === providerKey) return byId;
  }
  const transactions = await getCollection("payment_transactions");
  const transaction = await transactions.findOne({ provider_key: providerKey, provider_payment_id: String(providerPaymentId) });
  return transaction ? orders.findOne({ id: transaction.order_id }) : null;
}

async function markProviderPaymentFailed(order, providerKey, status, metadata = {}) {
  if (!order || order.payment_status === "paid") return;
  const orders = await getCollection("orders");
  await orders.updateOne({ id: order.id }, { $set: { payment_status: "denied", status: "Payment denied", payment_failure_reason: status } });
  await recordPaymentTransaction({ order, providerKey, status: "failed", metadata });
}

// Konnect calls this endpoint with ?payment_ref=. The request itself is not
// trusted: the server obtains the payment from Konnect again before marking paid.
checkoutRouter.get("/konnect/webhook", async (req, res, next) => {
  try {
    const paymentId = String(req.query.payment_ref || "");
    if (!paymentId) {
      res.status(400).json({ error: "Missing Konnect payment reference." });
      return;
    }
    const order = await findOrderForProviderPayment("konnect", paymentId);
    if (!order) {
      res.status(404).json({ error: "Order not found." });
      return;
    }
    const verification = await verifyKonnectPayment(paymentId, order);
    if (verification.paid) await completePaidOrder(order, "konnect", paymentId, verification.metadata);
    else if (["failed", "expired", "cancelled"].includes(verification.status)) await markProviderPaymentFailed(order, "konnect", verification.status, verification.metadata);
    res.json({ received: true });
  } catch (err) { next(err); }
});

// Paymee signs its webhook with MD5(token + payment_status + API token).
// The matching order, amount and token are checked before the order is fulfilled.
checkoutRouter.post("/paymee/webhook", async (req, res, next) => {
  try {
    const payload = req.body || {};
    if (!verifyPaymeeChecksum(payload)) {
      res.status(400).json({ error: "Invalid Paymee webhook checksum." });
      return;
    }
    const order = await findOrderForProviderPayment("paymee", payload.token, payload.order_id);
    if (!order || String(payload.order_id || "") !== order.id || Number(payload.amount) !== Number(roundCurrency(order.total, order.currency || "USD"))) {
      res.status(400).json({ error: "Paymee payment does not match the order." });
      return;
    }
    const metadata = { paymee_token: payload.token, paymee_transaction_id: payload.transaction_id || null };
    if (paymeePaymentSucceeded(payload)) await completePaidOrder(order, "paymee", String(payload.transaction_id || payload.token), metadata);
    else await markProviderPaymentFailed(order, "paymee", "failed", metadata);
    res.json({ received: true });
  } catch (err) { next(err); }
});

async function verifyAndCompleteFlouci(paymentId, orderId) {
  const order = await findOrderForProviderPayment("flouci", paymentId, orderId);
  if (!order) return { order: null, paid: false };
  const verification = await verifyFlouciPayment(paymentId, order);
  if (verification.paid) await completePaidOrder(order, "flouci", paymentId, verification.metadata);
  else if (["failure", "expired"].includes(verification.status)) await markProviderPaymentFailed(order, "flouci", verification.status, verification.metadata);
  return { order, paid: verification.paid };
}

// Flouci advises merchants to verify server-side after every success/failure webhook.
checkoutRouter.post("/flouci/webhook", async (req, res, next) => {
  try {
    const payload = req.body || {};
    const paymentId = payload.payment_id || payload.id || payload.data?.payment_id || payload.result?.payment_id;
    if (!paymentId) {
      res.status(400).json({ error: "Missing Flouci payment ID." });
      return;
    }
    await verifyAndCompleteFlouci(String(paymentId), payload.developer_tracking_id || payload.order_id || payload.data?.developer_tracking_id);
    res.json({ received: true });
  } catch (err) { next(err); }
});

// A customer return is only a convenience redirect. The same server-side
// Flouci verification is run, so a forged browser redirect cannot mark paid.
checkoutRouter.get("/flouci/return", async (req, res, next) => {
  try {
    const paymentId = String(req.query.payment_id || req.query.id || "");
    const orderId = String(req.query.order_id || "");
    if (!paymentId || !orderId) {
      res.redirect(`${env.clientOrigin}/checkout?payment=processing`);
      return;
    }
    const result = await verifyAndCompleteFlouci(paymentId, orderId);
    res.redirect(`${env.clientOrigin}/orders/${encodeURIComponent(orderId)}?payment=${result.paid ? "success" : "processing"}`);
  } catch (err) { next(err); }
});

checkoutRouter.post("/webhook", async (req, res, next) => {
  const stripe = getStripeClient();
  if (!stripe) {
    res.status(501).json({ error: "Stripe is not configured yet." });
    return;
  }

  let event = req.body;
  const signature = req.get("stripe-signature");

  try {
    // Accepting unsigned webhooks would allow anyone to mark an order paid.
    if (!env.stripeWebhookSecret) {
      res.status(503).json({ error: "Stripe webhook signing secret is not configured." });
      return;
    }
    event = stripe.webhooks.constructEvent(req.rawBody, signature, env.stripeWebhookSecret);

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object;
      const orderId = session.metadata?.order_id;
      if (orderId) {
        const orders = await getCollection("orders");
        const existing = await orders.findOne({ id: orderId });
        if (!existing) {
          // nothing to update
        } else if (existing.payment_status === "paid") {
          // idempotent: already processed
        } else {
          const expectedMinor = Math.round(Number(existing.total || 0) * minorUnitMultiplier(existing.currency || "USD"));
          if (session.currency?.toUpperCase() !== String(existing.currency || "USD").toUpperCase() || Number(session.amount_total) !== expectedMinor) {
            await orders.updateOne({ id: orderId }, { $set: { payment_status: "verification_failed", status: "Payment verification failed" } });
          } else {
            await completePaidOrder(existing, "stripe", session.payment_intent || session.id, { stripe_session_id: session.id, stripe_payment_intent: session.payment_intent || null });
          }
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    if (err.type === "StripeSignatureVerificationError") {
      res.status(400).json({ error: "Invalid Stripe webhook signature" });
      return;
    }
    next(err);
  }
});

// PayPal return/capture endpoint (PayPal redirects here after approval)
checkoutRouter.get("/paypal/return", async (req, res, next) => {
  try {
    const token = req.query.token || req.query.orderID || req.query.PayerID || null;
    const orderId = req.query.order_id;
    if (!token || !orderId) {
      res.redirect(`${env.clientOrigin}/checkout?payment=failed`);
      return;
    }

    const provider = await getPaymentProviderRecordByKey("paypal");
    const paypalConfig = getPayPalConfig(provider);
    if (!paypalConfig.clientId || !paypalConfig.clientSecret) {
      res.redirect(`${env.clientOrigin}/checkout?payment=failed`);
      return;
    }

    const paypalBase = getPayPalBase(paypalConfig.mode);
    const accessToken = await getPayPalAccessToken(paypalConfig);

    // capture the order
    const capRes = await fetch(`${paypalBase}/v2/checkout/orders/${token}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });
    const capData = await capRes.json();
    if (!capRes.ok) {
      // capture failed
      res.redirect(`${env.clientOrigin}/checkout?payment=failed&order=${orderId}`);
      return;
    }

    const order = await getOrderById(orderId);
    const captureAmount = capData?.purchase_units?.[0]?.payments?.captures?.[0]?.amount;
    if (!order || captureAmount?.currency_code !== String(order.currency || "USD").toUpperCase() || Number(captureAmount?.value) !== Number(roundCurrency(order.total, order.currency))) {
      res.redirect(`${env.clientOrigin}/checkout?payment=failed&order=${orderId}`);
      return;
    }
    await completePaidOrder(order, "paypal", getPayPalCaptureId(capData), { paypal_order_id: token, paypal_capture_id: getPayPalCaptureId(capData) });

    res.redirect(`${env.clientOrigin}/orders/${orderId}?payment=success`);
  } catch (err) {
    next(err);
  }
});

// PayPal webhook endpoint: verify signature and handle events
checkoutRouter.post("/paypal/webhook", async (req, res, next) => {
  try {
    const provider = await getPaymentProviderRecordByKey("paypal");
    const paypalConfig = getPayPalConfig(provider);
    if (!paypalConfig.clientId || !paypalConfig.clientSecret || !paypalConfig.webhookId) {
      res.status(501).json({ error: "PayPal webhooks not configured on the server." });
      return;
    }

    // Read PayPal transmission headers
    const transmissionId = req.get("paypal-transmission-id");
    const transmissionTime = req.get("paypal-transmission-time");
    const certUrl = req.get("paypal-cert-url");
    const authAlgo = req.get("paypal-auth-algo");
    const transmissionSig = req.get("paypal-transmission-sig");

    const paypalBase = getPayPalBase(paypalConfig.mode);
    const accessToken = await getPayPalAccessToken(paypalConfig);

    const verifyRes = await fetch(`${paypalBase}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: paypalConfig.webhookId,
        webhook_event: req.body
      })
    });
    const verifyData = await verifyRes.json();
    if (verifyData.verification_status !== "SUCCESS") {
      res.status(400).json({ error: "Invalid PayPal webhook signature" });
      return;
    }

    const event = req.body;
    // handle payment capture/completion events
    const eventType = event.event_type;
    if (eventType === "CHECKOUT.ORDER.APPROVED" || eventType === "PAYMENT.CAPTURE.COMPLETED" || eventType === "PAYMENT.CAPTURE.DENIED") {
      const paypalOrderId =
        event.resource?.supplementary_data?.related_ids?.order_id ||
        event.resource?.order_id ||
        event.resource?.purchase_units?.[0]?.reference_id ||
        event.resource?.id ||
        null;
      if (paypalOrderId) {
        const orders = await getCollection("orders");
        const order = await orders.findOne({ paypal_order_id: paypalOrderId });
        if (order) {
          if (order.payment_status === "paid") {
            // already processed
          } else if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
            await completePaidOrder(order, "paypal", getPayPalCaptureId(event), {
              paypal_order_id: paypalOrderId,
              paypal_capture_id: getPayPalCaptureId(event)
            });
          } else if (eventType === "PAYMENT.CAPTURE.DENIED") {
            await orders.updateOne({ id: order.id }, { $set: { payment_status: "denied", status: "Payment denied" } });
          } else if (eventType === "CHECKOUT.ORDER.APPROVED") {
            // nothing to do here server-side; wait for capture
          }
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
});
