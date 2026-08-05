import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { requireAuth } from "../../middleware/auth.js";
import { getCollection } from "../../db/mongo.js";
import { dispatchSupplierOrder } from "../suppliers/supplier.service.js";
import { getOrderById } from "../orders/orders.routes.js";
import { notifyCustomerPaymentReceived } from "../notifications/notification.service.js";
import {
  getPaymentProviderByKey,
  getStripeClient,
  isPayPalProvider,
  isRedirectPaymentProvider,
  isStripeProvider
} from "../payments/payment.service.js";
import { minorUnitMultiplier, providerSupportsCurrency, roundCurrency } from "../currencies/currency.service.js";

export const checkoutRouter = Router();

function getPayPalConfig(provider) {
  return {
    clientId: provider?.config?.clientId || env.paypalClientId,
    clientSecret: provider?.config?.clientSecret || env.paypalClientSecret,
    mode: provider?.config?.mode || env.paypalMode || "sandbox",
    webhookId: provider?.config?.webhookId || env.paypalWebhookId
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

    const provider = await getPaymentProviderByKey(payload.provider_key);
    if (!provider || !provider.enabled || !isRedirectPaymentProvider(provider)) {
      res.status(400).json({ error: "Selected payment method is unavailable." });
      return;
    }

    const currency = String(order.currency || "USD").toUpperCase();
    if (!providerSupportsCurrency(provider.provider_key, currency, provider.config || {})) {
      res.status(400).json({ error: `${provider.name} cannot process ${currency}. Choose another currency or payment method.` });
      return;
    }
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
        res.json({ url: approveLink });
        return;
      } catch (err) {
        next(err);
        return;
      }
    }

    res.status(400).json({ error: "This payment method does not support direct online payment." });
  } catch (err) {
    next(err);
  }
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
    if (env.stripeWebhookSecret) {
      event = stripe.webhooks.constructEvent(req.rawBody, signature, env.stripeWebhookSecret);
    }

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
          await orders.updateOne(
            { id: orderId },
            {
              $set: {
                status: "Paid",
                payment_status: "paid",
                stripe_session_id: session.id,
                stripe_payment_intent: session.payment_intent || null,
                paid_at: new Date()
              }
            }
          );

          notifyCustomerPaymentReceived(orderId).catch((err) => console.error("[notification:payment-received]", err.message));
          await dispatchSupplierOrder(orderId).catch(async (err) => {
            await orders.updateOne({ id: orderId }, { $set: { supplier_dispatch_error: err.message } });
          });
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

    const provider = await getPaymentProviderByKey("paypal");
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

    // mark order as paid and dispatch
    const orders = await getCollection("orders");
    await orders.updateOne(
      { id: orderId },
      {
        $set: {
          status: "Paid",
          payment_status: "paid",
          paypal_order_id: token,
          paypal_capture_id: getPayPalCaptureId(capData),
          paid_at: new Date()
        }
      }
    );

    notifyCustomerPaymentReceived(orderId).catch((err) => console.error("[notification:payment-received]", err.message));
    await dispatchSupplierOrder(orderId).catch(async (err) => {
      await orders.updateOne({ id: orderId }, { $set: { supplier_dispatch_error: err.message } });
    });

    res.redirect(`${env.clientOrigin}/orders/${orderId}?payment=success`);
  } catch (err) {
    next(err);
  }
});

// PayPal webhook endpoint: verify signature and handle events
checkoutRouter.post("/paypal/webhook", async (req, res, next) => {
  try {
    const provider = await getPaymentProviderByKey("paypal");
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
            await orders.updateOne({ id: order.id }, { $set: { status: "Paid", payment_status: "paid", paypal_capture_id: getPayPalCaptureId(event), paid_at: new Date() } });
            notifyCustomerPaymentReceived(order.id).catch((err) => console.error("[notification:payment-received]", err.message));
            await dispatchSupplierOrder(order.id).catch(async (err) => {
              await orders.updateOne({ id: order.id }, { $set: { supplier_dispatch_error: err.message } });
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
