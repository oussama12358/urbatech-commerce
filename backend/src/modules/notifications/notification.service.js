import { Resend } from "resend";
import { env } from "../../config/env.js";
import { getCollection } from "../../db/mongo.js";

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(value, currency = "USD") {
  return `${currency} ${Number(value || 0).toFixed(2)}`;
}

function recipients(value) {
  if (!value) return [];
  return (Array.isArray(value) ? value : String(value).split(","))
    .map((email) => String(email || "").trim())
    .filter(Boolean);
}

function orderCustomerEmail(order = {}) {
  return order.billing?.customerEmail || order.billing?.email || "";
}

function orderCustomerName(order = {}) {
  return order.billing?.customerName || order.billing?.name || order.billing?.fullName || "Customer";
}

function supplierEmail(supplier = {}) {
  return supplier.notification_email || supplier.contact_email || supplier.email || supplier.payout_email || supplier.paypal_email || "";
}

function fulfillmentEvent(status) {
  const normalized = String(status || "").toLowerCase().replace(/[_-]+/g, " ");
  if (!normalized) return null;
  if (normalized.includes("out for delivery") || normalized.includes("out for shipment")) return "out_for_delivery";
  if (normalized.includes("delivered")) return "delivered";
  if (normalized.includes("shipped") || normalized.includes("shipment")) return "shipped";
  if (normalized.includes("preparing") || normalized.includes("processing") || normalized.includes("accepted")) return "processing";
  return null;
}

function fulfillmentTitle(event) {
  if (event === "delivered") return "Order delivered";
  if (event === "out_for_delivery") return "Order out for delivery";
  if (event === "shipped") return "Order shipped";
  if (event === "processing") return "Order is being prepared";
  return "Order update";
}

function fulfillmentSentence(event) {
  if (event === "delivered") return "has been delivered";
  if (event === "out_for_delivery") return "is out for delivery";
  if (event === "shipped") return "has been shipped";
  if (event === "processing") return "is being prepared";
  return "has been updated";
}

function layout(title, body) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;color:#172033">
      <div style="border-bottom:1px solid #e8edf5;padding-bottom:16px;margin-bottom:24px">
        <strong style="font-size:18px">URBA TECH INTER</strong>
        <div style="color:#f5a800;font-size:12px;letter-spacing:3px;margin-top:2px">INTER</div>
      </div>
      <h1 style="font-size:24px;line-height:1.25;margin:0 0 16px">${escapeHtml(title)}</h1>
      ${body}
      <p style="margin-top:28px;color:#6b7280;font-size:12px">This message was sent automatically by URBA TECH INTER.</p>
    </div>
  `;
}

function rows(items = [], currency = "USD") {
  if (!items.length) return "";
  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #edf1f7">${escapeHtml(item.name || item.product_id)}</td>
          <td style="padding:8px;border-bottom:1px solid #edf1f7;text-align:center">${Number(item.quantity || item.qty || 0)}</td>
          <td style="padding:8px;border-bottom:1px solid #edf1f7;text-align:right">${money(item.unit_price, currency)}</td>
          <td style="padding:8px;border-bottom:1px solid #edf1f7;text-align:right">${money(item.total, currency)}</td>
        </tr>`
    )
    .join("");
  return `
    <table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:14px">
      <thead>
        <tr>
          <th style="padding:8px;text-align:left;border-bottom:2px solid #dbe3ef">Product</th>
          <th style="padding:8px;text-align:center;border-bottom:2px solid #dbe3ef">Qty</th>
          <th style="padding:8px;text-align:right;border-bottom:2px solid #dbe3ef">Unit</th>
          <th style="padding:8px;text-align:right;border-bottom:2px solid #dbe3ef">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
  `;
}

async function loadOrderWithItems(orderId) {
  const orders = await getCollection("orders");
  const orderItems = await getCollection("order_items");
  const order = await orders.findOne({ id: orderId });
  if (!order) return null;
  const items = await orderItems.find({ order_id: order.id }).toArray();
  return { ...order, items };
}

export async function sendNotificationEmail({ to, subject, html, type, entity = {}, dedupeKey = "", subject_key = null, subject_params = null }) {
  const toList = recipients(to);
  const notifications = await getCollection("email_notifications");
  const now = new Date();

  if (dedupeKey) {
    const existing = await notifications.findOne({ dedupe_key: dedupeKey, status: "sent" });
    if (existing) return { success: true, skipped: true, reason: "deduped" };
  }

  const baseLog = {
    type,
    to: toList,
    subject,
    subject_key: subject_key || null,
    subject_params: subject_params || null,
    entity,
    dedupe_key: dedupeKey || null,
    created_at: now,
    updated_at: now
  };

  if (!toList.length) {
    await notifications.insertOne({ ...baseLog, status: "skipped_no_recipient", error: "No recipient configured." });
    return { success: false, skipped: true, error: "No recipient configured." };
  }

  if (!env.resendApiKey || !env.emailFrom) {
    await notifications.insertOne({ ...baseLog, status: "skipped_config", error: "RESEND_API_KEY or EMAIL_FROM is missing." });
    return { success: false, skipped: true, error: "RESEND_API_KEY or EMAIL_FROM is missing." };
  }

  const resend = new Resend(env.resendApiKey);
  try {
    const result = await resend.emails.send({
      from: env.emailFrom,
      to: toList,
      subject,
      html
    });
    if (result.error) {
      await notifications.insertOne({ ...baseLog, status: "failed", error: result.error });
      return { success: false, error: result.error };
    }
    await notifications.insertOne({ ...baseLog, status: "sent", provider_message_id: result.data?.id || null });
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    await notifications.insertOne({ ...baseLog, status: "failed", error: error.message });
    return { success: false, error: error.message };
  }
}

export async function notifyCustomerOrderConfirmed(orderId) {
  const order = await loadOrderWithItems(orderId);
  if (!order) return null;
  const currency = order.currency || "USD";
  return sendNotificationEmail({
    to: orderCustomerEmail(order),
    subject: `Order ${order.id} confirmed`,
    type: "customer_order_confirmed",
    entity: { order_id: order.id },
    dedupeKey: `customer_order_confirmed:${order.id}`,
    html: layout(
      `Order ${order.id} confirmed`,
      `
        <p>Hello ${escapeHtml(orderCustomerName(order))},</p>
        <p>Your order has been received. We will start processing it as soon as payment is confirmed.</p>
        ${rows(order.items, currency)}
        <p><strong>Order total:</strong> ${money(order.total, currency)}</p>
      `
    )
  });
}

export async function notifyCustomerPaymentReceived(orderId) {
  const order = await loadOrderWithItems(orderId);
  if (!order) return null;
  const currency = order.currency || "USD";
  return sendNotificationEmail({
    to: orderCustomerEmail(order),
    subject: `Payment received for order ${order.id}`,
    type: "customer_payment_received",
    entity: { order_id: order.id },
    dedupeKey: `customer_payment_received:${order.id}`,
    html: layout(
      `Payment received`,
      `
        <p>Hello ${escapeHtml(orderCustomerName(order))},</p>
        <p>Your payment for order <strong>${escapeHtml(order.id)}</strong> was received successfully.</p>
        ${rows(order.items, currency)}
        <p><strong>Paid total:</strong> ${money(order.total, currency)}</p>
      `
    )
  });
}

export async function notifyCustomerFulfillmentUpdate(orderId, status, { previousStatus = null, trackingChanged = false } = {}) {
  const order = await loadOrderWithItems(orderId);
  if (!order) return null;
  const event = fulfillmentEvent(status || order.status);
  if (!event) return null;
  const previousEvent = fulfillmentEvent(previousStatus);
  if (previousEvent === event && !trackingChanged) return null;
  const title = fulfillmentTitle(event);
  return sendNotificationEmail({
    to: orderCustomerEmail(order),
    subject: `${title}: ${order.id}`,
    type: `customer_order_${event}`,
    entity: { order_id: order.id },
    dedupeKey: `customer_order_${event}:${order.id}`,
    html: layout(
      title,
      `
        <p>Hello ${escapeHtml(orderCustomerName(order))},</p>
        <p>Your order <strong>${escapeHtml(order.id)}</strong> ${escapeHtml(fulfillmentSentence(event))}.</p>
        ${order.carrier || order.tracking ? `<p><strong>Carrier:</strong> ${escapeHtml(order.carrier || "-")}<br><strong>Tracking:</strong> ${escapeHtml(order.tracking || "-")}</p>` : ""}
      `
    )
  });
}

export async function notifyCustomerRefundInitiated(orderId, refund) {
  const order = await loadOrderWithItems(orderId);
  if (!order) return null;
  const currency = refund?.currency || order.currency || "USD";
  return sendNotificationEmail({
    to: orderCustomerEmail(order),
    subject: `Refund initiated for order ${order.id}`,
    type: "customer_refund_initiated",
    entity: { order_id: order.id, refund_id: refund?.id || null },
    dedupeKey: `customer_refund_initiated:${refund?.id || order.id}`,
    html: layout(
      "Refund initiated",
      `
        <p>Hello ${escapeHtml(orderCustomerName(order))},</p>
        <p>Your refund request for order <strong>${escapeHtml(order.id)}</strong> has been started.</p>
        <p><strong>Refund amount:</strong> ${money(refund?.amount, currency)}</p>
      `
    )
  });
}

export async function notifyCustomerRefundCompleted(orderId, refund) {
  const order = await loadOrderWithItems(orderId);
  if (!order) return null;
  const currency = refund?.currency || order.currency || "USD";
  return sendNotificationEmail({
    to: orderCustomerEmail(order),
    subject: `Refund processed for order ${order.id}`,
    type: "customer_refund_completed",
    entity: { order_id: order.id, refund_id: refund?.id || null },
    dedupeKey: `customer_refund_completed:${refund?.id || order.id}`,
    html: layout(
      "Refund completed",
      `
        <p>Hello ${escapeHtml(orderCustomerName(order))},</p>
        <p>Your refund for order <strong>${escapeHtml(order.id)}</strong> has been processed.</p>
        <p><strong>Refund amount:</strong> ${money(refund?.amount, currency)}</p>
      `
    )
  });
}

export async function notifySupplierNewOrder(orderId, supplierId, dispatch = {}) {
  const order = await loadOrderWithItems(orderId);
  if (!order) return null;
  const suppliers = await getCollection("suppliers");
  const supplier = await suppliers.findOne({ id: supplierId });
  if (!supplier) return null;
  const supplierItems = order.items.filter((item) => item.supplier_id === supplierId);
  const currency = order.currency || "USD";
  const customer = order.billing || {};
  return sendNotificationEmail({
    to: supplierEmail(supplier),
    subject: `New supplier order ${dispatch.supplier_order_id || order.id}`,
    type: "supplier_new_order",
    entity: { order_id: order.id, supplier_id: supplierId, supplier_order_id: dispatch.supplier_order_id || null },
    dedupeKey: `supplier_new_order:${order.id}:${supplierId}`,
    html: layout(
      "New supplier order",
      `
        <p>A new URBA TECH order is ready for fulfillment.</p>
        <p>
          <strong>Order:</strong> ${escapeHtml(order.id)}<br>
          <strong>Supplier order:</strong> ${escapeHtml(dispatch.supplier_order_id || "-")}<br>
          <strong>Customer:</strong> ${escapeHtml(orderCustomerName(order))}<br>
          <strong>Email:</strong> ${escapeHtml(customer.customerEmail || customer.email || "-")}<br>
          <strong>Phone:</strong> ${escapeHtml(customer.phone || "-")}<br>
          <strong>Address:</strong> ${escapeHtml(customer.address || customer.shippingAddress || "-")}
        </p>
        ${rows(supplierItems, currency)}
        <p>
          <strong>Supplier payable:</strong> ${money(dispatch.supplier_payable, currency)}<br>
          <strong>Platform commission:</strong> ${money(dispatch.commission_total, currency)}
        </p>
      `
    )
  });
}

export async function notifySupplierSettlementPaid(settlement) {
  const suppliers = await getCollection("suppliers");
  const supplier = await suppliers.findOne({ id: settlement.supplier_id });
  if (!supplier) return null;
  const currency = settlement.currency || "USD";
  return sendNotificationEmail({
    to: supplierEmail(supplier),
    subject: `Settlement paid: ${settlement.id}`,
    type: "supplier_settlement_paid",
    entity: { settlement_id: settlement.id, supplier_id: settlement.supplier_id, order_id: settlement.order_id },
    dedupeKey: `supplier_settlement_paid:${settlement.id}:${settlement.status}`,
    html: layout(
      "Settlement paid",
      `
        <p>Your URBA TECH supplier settlement has been marked as ${escapeHtml(settlement.status)}.</p>
        <p>
          <strong>Settlement:</strong> ${escapeHtml(settlement.id)}<br>
          <strong>Order:</strong> ${escapeHtml(settlement.order_id || "-")}<br>
          <strong>Amount:</strong> ${money(settlement.amount, currency)}<br>
          <strong>Method:</strong> ${escapeHtml(settlement.payment_method || "-")}<br>
          <strong>Reference:</strong> ${escapeHtml(settlement.payout_reference || "-")}
        </p>
      `
    )
  });
}

export async function notifyAdminAlert({ subject, subjectKey = null, subjectParams = null, type, message, entity = {}, dedupeKey = "" }) {
  return sendNotificationEmail({
    to: env.adminNotificationEmails,
    subject,
    subject_key: subjectKey,
    subject_params: subjectParams,
    type,
    entity,
    dedupeKey,
    html: layout(
      subject,
      `
        <p>${escapeHtml(message)}</p>
        <pre style="background:#f6f8fb;border:1px solid #e1e7f0;border-radius:6px;padding:12px;white-space:pre-wrap">${escapeHtml(JSON.stringify(entity, null, 2))}</pre>
      `
    )
  });
}

export async function notifyAdminLowStock(product) {
  const stock = Number(product?.stock || 0);
  if (!product || stock > env.lowStockThreshold) return null;
  return notifyAdminAlert({
    subject: `Low stock: ${product.name || product.id}`,
    type: "admin_low_stock",
    message: `Product stock is at ${stock}, threshold is ${env.lowStockThreshold}.`,
    entity: { product_id: product.id, name: product.name, stock, threshold: env.lowStockThreshold, supplier_id: product.supplier_id || null },
    dedupeKey: `admin_low_stock:${product.id}:${stock}`
  });
}
