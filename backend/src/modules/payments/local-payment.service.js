import crypto from "crypto";
import { env } from "../../config/env.js";
import { minorUnitMultiplier, roundCurrency } from "../currencies/currency.service.js";

function providerError(provider, responseText) {
  return new Error(`${provider} could not start the payment: ${responseText}`);
}

async function readJson(response, provider) {
  const text = await response.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  if (!response.ok) throw providerError(provider, body?.message || body?.error || text || `HTTP ${response.status}`);
  return body;
}

function fullNameParts(order) {
  const billing = order.billing || {};
  const name = String(billing.customerName || billing.name || "Customer").trim().split(/\s+/);
  return { firstName: name[0] || "Customer", lastName: name.slice(1).join(" ") || "URBA TECH" };
}

export function localProviderConfigured(key) {
  if (key === "konnect") return Boolean(env.konnectApiKey && env.konnectReceiverWalletId);
  if (key === "paymee") return Boolean(env.paymeeApiKey);
  if (key === "flouci") return Boolean(env.flouciPublicKey && env.flouciPrivateKey);
  return false;
}

export async function createKonnectPayment(order) {
  const currency = String(order.currency || "USD").toUpperCase();
  if (!new Set(["TND", "EUR", "USD"]).has(currency)) {
    throw new Error("Konnect accepts TND, EUR, or USD for this checkout.");
  }
  const amount = Math.round(Number(order.total || 0) * minorUnitMultiplier(currency));
  const { firstName, lastName } = fullNameParts(order);
  const billing = order.billing || {};
  const response = await fetch(`${env.konnectApiBaseUrl.replace(/\/$/, "")}/payments/init-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": env.konnectApiKey },
    body: JSON.stringify({
      receiverWalletId: env.konnectReceiverWalletId,
      token: currency,
      amount,
      type: "immediate",
      description: `URBA TECH order ${order.id}`,
      acceptedPaymentMethods: ["wallet", "bank_card", "e-DINAR"],
      // Konnect defines lifespan in minutes, not seconds.
      lifespan: 30,
      checkoutForm: true,
      firstName,
      lastName,
      phoneNumber: billing.phone || billing.customerPhone || undefined,
      email: billing.customerEmail || billing.email || undefined,
      orderId: order.id,
      webhook: `${env.apiOrigin}/api/checkout/konnect/webhook`
    })
  });
  const data = await readJson(response, "Konnect");
  const payment = data.payment || data;
  const paymentId = payment.id || data.paymentRef || data.payment_ref;
  const url = payment.payUrl || payment.pay_url || payment.link || data.payUrl || data.pay_url || data.link;
  if (!paymentId || !url) throw new Error("Konnect did not return a payment reference and checkout URL.");
  return { providerPaymentId: paymentId, url, metadata: { konnect_payment_id: paymentId } };
}

export async function verifyKonnectPayment(paymentId, order) {
  const response = await fetch(`${env.konnectApiBaseUrl.replace(/\/$/, "")}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { "x-api-key": env.konnectApiKey }
  });
  const data = await readJson(response, "Konnect");
  const payment = data.payment || data;
  const expectedAmount = Math.round(Number(order.total || 0) * minorUnitMultiplier(order.currency || "USD"));
  const successfulTransaction = (payment.transactions || []).some((transaction) => String(transaction.status || "").toLowerCase() === "success");
  return {
    paid: String(payment.status || "").toLowerCase() === "completed" && successfulTransaction &&
      String(payment.token || "").toUpperCase() === String(order.currency || "USD").toUpperCase() &&
      Number(payment.reachedAmount ?? payment.amount) === expectedAmount && String(payment.orderId || order.id) === order.id,
    status: String(payment.status || "").toLowerCase(),
    metadata: { konnect_payment_id: paymentId, konnect_status: payment.status, konnect_transaction_status: payment.transactions?.[0]?.status || null }
  };
}

export async function createPaymeePayment(order) {
  const currency = String(order.currency || "USD").toUpperCase();
  if (currency !== "TND") throw new Error("Paymee accepts TND only. Please choose TND or another payment method.");
  const { firstName, lastName } = fullNameParts(order);
  const billing = order.billing || {};
  const base = env.paymeeMode === "live" ? "https://app.paymee.tn" : "https://sandbox.paymee.tn";
  const response = await fetch(`${base}/api/v2/payments/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Token ${env.paymeeApiKey}` },
    body: JSON.stringify({
      amount: Number(roundCurrency(order.total, currency)),
      note: `URBA TECH order ${order.id}`,
      first_name: firstName,
      last_name: lastName,
      email: billing.customerEmail || billing.email || "customer@urbatech.local",
      phone: billing.phone || billing.customerPhone || "00000000",
      return_url: `${env.clientOrigin}/orders/${order.id}?payment=processing`,
      cancel_url: `${env.clientOrigin}/checkout?payment=cancelled&order=${order.id}`,
      webhook_url: `${env.apiOrigin}/api/checkout/paymee/webhook`,
      order_id: order.id
    })
  });
  const data = await readJson(response, "Paymee");
  const payment = data.data || {};
  if (!data.status || !payment.token || !payment.payment_url) throw new Error(data.message || "Paymee did not return a checkout URL.");
  return { providerPaymentId: payment.token, url: payment.payment_url, metadata: { paymee_token: payment.token } };
}

export function verifyPaymeeChecksum(payload) {
  const token = String(payload?.token || "");
  const status = payload?.payment_status === true || payload?.payment_status === 1 || String(payload?.payment_status).toLowerCase() === "true" || String(payload?.payment_status) === "1" ? "1" : "0";
  const expected = crypto.createHash("md5").update(`${token}${status}${env.paymeeApiKey}`).digest("hex");
  const received = String(payload?.check_sum || "").toLowerCase();
  if (!received || received.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

export function paymeePaymentSucceeded(payload) {
  return payload?.payment_status === true || payload?.payment_status === 1 || String(payload?.payment_status).toLowerCase() === "true" || String(payload?.payment_status) === "1";
}

export async function createFlouciPayment(order) {
  const currency = String(order.currency || "USD").toUpperCase();
  if (currency !== "TND") throw new Error("Flouci accepts TND only. Please choose TND or another payment method.");
  const amount = Math.round(Number(order.total || 0) * minorUnitMultiplier(currency));
  const response = await fetch(`${env.flouciApiBaseUrl.replace(/\/$/, "")}/generate_payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.flouciPublicKey}:${env.flouciPrivateKey}`
    },
    body: JSON.stringify({
      amount: String(amount),
      developer_tracking_id: order.id,
      accept_card: true,
      success_link: `${env.apiOrigin}/api/checkout/flouci/return?order_id=${encodeURIComponent(order.id)}`,
      fail_link: `${env.clientOrigin}/checkout?payment=cancelled&order=${encodeURIComponent(order.id)}`,
      webhook: `${env.apiOrigin}/api/checkout/flouci/webhook`,
      client_id: order.customer_id
    })
  });
  const data = await readJson(response, "Flouci");
  const payment = data.result || data;
  if (!payment.success || !payment.payment_id || !payment.link) throw new Error("Flouci did not return a checkout URL.");
  return { providerPaymentId: payment.payment_id, url: payment.link, metadata: { flouci_payment_id: payment.payment_id } };
}

export async function verifyFlouciPayment(paymentId, order) {
  const response = await fetch(`${env.flouciApiBaseUrl.replace(/\/$/, "")}/verify_payment/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${env.flouciPublicKey}:${env.flouciPrivateKey}` }
  });
  const data = await readJson(response, "Flouci");
  const payment = data.result || {};
  const expectedAmount = Math.round(Number(order.total || 0) * minorUnitMultiplier(order.currency || "TND"));
  return {
    paid: data.success === true && payment.status === "SUCCESS" && Number(payment.amount) === expectedAmount && payment.developer_tracking_id === order.id,
    status: String(payment.status || "").toLowerCase(),
    metadata: { flouci_payment_id: paymentId, flouci_status: payment.status }
  };
}
