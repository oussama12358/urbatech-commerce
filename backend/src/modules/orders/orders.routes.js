import { Router } from "express";
import { z } from "zod";
import { getCollection } from "../../db/mongo.js";
import { requireAuth } from "../../middleware/auth.js";
import { notifyCustomerOrderConfirmed } from "../notifications/notification.service.js";
import { releaseStockForItems, reserveStockForItems } from "./inventory.service.js";
import {
  checkProductAvailabilityInCountry,
  countryName,
  toCountryCode
} from "../../utils/shipping-countries.js";
import { getExchangeQuote, productBaseCurrency, sellingBasePrice, normalizeCurrency, roundCurrency } from "../currencies/currency.service.js";

const orderSchema = z.object({
  billing: z.record(z.any()).default({}),
  items: z.array(
    z.object({
      id: z.string(),
      qty: z.number().int().positive()
    })
  ),
  currency: z.string().length(3).optional()
});
export const ordersRouter = Router();

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function serializeOrder(order, items = [], { includeInternal = false } = {}) {
  const serialized = {
    id: order.id,
    status: order.status,
    payment_status: order.payment_status || null,
    payment_method: order.payment_method || null,
    subtotal: order.subtotal,
    service_fee: order.service_fee,
    shipping: order.shipping,
    total: order.total,
    currency: order.currency || "USD",
    billing: order.billing,
    tracking: order.tracking || null,
    carrier: order.carrier || null,
    stripe_session_id: order.stripe_session_id || null,
    paid_at: order.paid_at || null,
    created_at: order.created_at,
    items: items.map((item) => ({
      product_id: item.product_id,
      name: item.name || item.product_id,
      qty: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
      ...(includeInternal
        ? {
            supplier_id: item.supplier_id || null,
            supplier_product_id: item.supplier_product_id || null,
            cost_price: item.cost_price || 0,
            supplier_total: item.supplier_total || 0,
            commission: item.commission || 0,
            commission_rate: item.commission_rate || 0
          }
        : {})
    }))
  };

  if (includeInternal) {
    return {
      ...serialized,
      supplier_id: order.supplier_id || null,
      supplier_order_id: order.supplier_order_id || null,
      supplier_dispatches: order.supplier_dispatches || [],
      supplier_dispatch_failures: order.supplier_dispatch_failures || [],
      supplier_dispatch_error: order.supplier_dispatch_error || null,
      supplier_payable: order.supplier_payable || 0,
      product_commission: order.product_commission || 0,
      platform_commission: order.platform_commission || 0,
      stock_reserved: Boolean(order.stock_reserved),
      stock_released_at: order.stock_released_at || null,
      refund_status: order.refund_status || null,
      refund_amount: order.refund_amount || 0,
      exchange_rate_snapshot: order.exchange_rate_snapshot || null
    };
  }

  return serialized;
}

async function buildTrustedOrderItems(payloadItems, billing = {}, currency = "USD") {
  const products = await getCollection("products");
  const suppliers = await getCollection("suppliers");
  const quantities = new Map();
  for (const item of payloadItems) {
    quantities.set(item.id, (quantities.get(item.id) || 0) + item.qty);
  }

  const productIds = [...quantities.keys()];
  const productRows = await products.find({ id: { $in: productIds }, active: true }).toArray();
  const productMap = new Map(productRows.map((product) => [product.id, product]));

  const missing = productIds.filter((id) => !productMap.has(id));
  if (missing.length) {
    const error = new Error(`Unavailable product: ${missing[0]}`);
    error.status = 400;
    throw error;
  }

  const supplierIds = [...new Set(productRows.map((product) => product.supplier_id).filter(Boolean))];
  const supplierRows = supplierIds.length
    ? await suppliers.find({ id: { $in: supplierIds } }).toArray()
    : [];
  const supplierMap = new Map(supplierRows.map((supplier) => [supplier.id, supplier]));

  const countryInput = billing.country_code || billing.countryCode || billing.country || "";
  const destinationCode = toCountryCode(countryInput);

  for (const product of productRows) {
    const supplier = product.supplier_id ? supplierMap.get(product.supplier_id) : null;
    const availability = checkProductAvailabilityInCountry(product, supplier, {
      country: billing.country,
      country_code: billing.country_code || billing.countryCode || destinationCode
    });
    if (!availability.shipsWorldwide && !availability.available) {
      const countryLabel = countryName(availability.countryCode) || billing.country || "your country";
      const error = new Error(
        `"${product.name}" is not available in ${countryLabel}. This product cannot be shipped to your country.`
      );
      error.status = 400;
      error.code = "NOT_AVAILABLE_IN_COUNTRY";
      error.product_id = product.id;
      error.country_code = availability.countryCode;
      throw error;
    }
  }

  let subtotal = 0;
  let supplierPayable = 0;
  let productCommission = 0;

  const items = await Promise.all(productIds.map(async (productId) => {
    const product = productMap.get(productId);
    const quantity = quantities.get(productId);
    const baseCurrency = productBaseCurrency(product);
    const baseUnitPrice = sellingBasePrice(product);
    const unitQuote = await getExchangeQuote(baseUnitPrice, baseCurrency, currency);
    const costQuote = await getExchangeQuote(product.cost_price ?? baseUnitPrice, baseCurrency, currency);
    const unitPrice = unitQuote.amount;
    const costPrice = costQuote.amount;
    const lineTotal = roundMoney(unitPrice * quantity);
    const supplierTotal = roundMoney(costPrice * quantity);
    const commission = roundMoney(Math.max(0, lineTotal - supplierTotal));
    const commissionRate = lineTotal ? Math.round((commission / lineTotal) * 10000) / 100 : 0;

    subtotal = roundMoney(subtotal + lineTotal);
    supplierPayable = roundMoney(supplierPayable + supplierTotal);
    productCommission = roundMoney(productCommission + commission);

    return {
      order_id: null,
      product_id: productId,
      name: product.name,
      quantity,
      base_unit_price: baseUnitPrice,
      base_currency: baseCurrency,
      order_currency: currency,
      exchange_rate: unitQuote.rate,
      exchange_rate_as_of: unitQuote.fetched_at,
      unit_price: unitPrice,
      cost_price: costPrice,
      total: lineTotal,
      supplier_id: product.supplier_id || null,
      supplier_product_id: product.supplier_product_id || null,
      supplier_total: supplierTotal,
      commission,
      commission_rate: commissionRate
    };
  }));

  return { items, subtotal, supplierPayable, productCommission };
}

function itemProjection(includeInternal = false) {
  return {
    _id: 0,
    product_id: 1,
    name: 1,
    quantity: 1,
    unit_price: 1,
    total: 1,
    base_unit_price: 1,
    base_currency: 1,
    order_currency: 1,
    exchange_rate: 1,
    exchange_rate_as_of: 1,
    ...(includeInternal
      ? {
          supplier_id: 1,
          supplier_product_id: 1,
          cost_price: 1,
          supplier_total: 1,
          commission: 1,
          commission_rate: 1
        }
      : {})
  };
}

ordersRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const orders = await getCollection("orders");
    const orderItems = await getCollection("order_items");
    const rows = await orders
      .find({ customer_id: req.user.id })
      .sort({ created_at: -1 })
      .limit(200)
      .toArray();

    const ordersWithItems = await Promise.all(
      rows.map(async (order) => {
        const items = await orderItems
          .find({ order_id: order.id })
          .project(itemProjection(false))
          .toArray();
        return serializeOrder(order, items, { includeInternal: false });
      })
    );

    res.json({ data: ordersWithItems });
  } catch (err) {
    next(err);
  }
});

ordersRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order || order.customer_id !== req.user.id) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json({ data: order });
  } catch (err) {
    next(err);
  }
});

ordersRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const payload = orderSchema.parse(req.body);
    const billing = payload.billing || {};
    const currency = normalizeCurrency(payload.currency || "USD");
    const trusted = await buildTrustedOrderItems(payload.items, billing, currency);
    const subtotal = trusted.subtotal;
    const service = roundCurrency(subtotal * 0.03, currency);
    // Shipping is configured in USD and converted dynamically at order creation.
    const shippingQuote = subtotal ? await getExchangeQuote(120, "USD", currency) : null;
    const shipping = shippingQuote?.amount || 0;
    const total = roundCurrency(subtotal + service + shipping, currency);
    const platformCommission = roundMoney(trusted.productCommission + service);

    const customerId = req.user.id;
    const id = "UT-" + Date.now().toString().slice(-6);
    const orders = await getCollection("orders");
    const orderItems = await getCollection("order_items");
    let stockReserved = false;

    try {
      await reserveStockForItems(trusted.items, id);
      stockReserved = true;
    } catch (err) {
      next(err);
      return;
    }

    try {
      await orders.insertOne({
        id,
        customer_id: customerId,
        status: "Payment pending",
        payment_status: "pending",
        subtotal,
        service_fee: service,
        shipping,
        total,
        currency,
        exchange_rate_snapshot: {
          rate_provider_base: "USD",
          shipping_usd_to_order_rate: shippingQuote?.rate || 1,
          fetched_at: shippingQuote?.fetched_at || new Date()
        },
        supplier_payable: trusted.supplierPayable,
        product_commission: trusted.productCommission,
        platform_commission: platformCommission,
        stock_reserved: true,
        stock_reserved_at: new Date(),
        billing,
        created_at: new Date()
      });

      if (trusted.items.length > 0) {
        const itemsToInsert = trusted.items.map((item) => ({ ...item, order_id: id }));
        await orderItems.insertMany(itemsToInsert);
      }

      const createdOrder = await orders.findOne({ id });
      const itemsRaw = await orderItems
        .find({ order_id: id })
        .project(itemProjection(false))
        .toArray();

      const customers = await getCollection("customers");
      const customerUpdateFields = {};
      if (billing?.phone) customerUpdateFields.phone = billing.phone;
      if (billing?.address) customerUpdateFields.address = billing.address;
      if (billing?.city) customerUpdateFields.city = billing.city;
      if (billing?.country) customerUpdateFields.country = billing.country;
      if (billing?.country_code) customerUpdateFields.country_code = billing.country_code;
      if (billing?.postalCode) customerUpdateFields.postalCode = billing.postalCode;
      if (Object.keys(customerUpdateFields).length > 0) {
        await customers.updateOne(
          { id: customerId },
          { $set: customerUpdateFields }
        );
      }

      notifyCustomerOrderConfirmed(id).catch((err) => console.error("[notification:order-confirmed]", err.message));
      res.status(201).json({
        data: serializeOrder(createdOrder, itemsRaw, { includeInternal: false })
      });
    } catch (err) {
      if (stockReserved) {
        await releaseStockForItems(trusted.items, id).catch(() => {});
      }
      next(err);
    }
  } catch (err) {
    next(err);
  }
});

export async function getAllOrders() {
  const orders = await getCollection("orders");
  const orderItems = await getCollection("order_items");
  const rows = await orders
    .find()
    .sort({ created_at: -1 })
    .limit(500)
    .toArray();

  const ordersWithItems = await Promise.all(
    rows.map(async (order) => {
      const items = await orderItems
        .find({ order_id: order.id })
        .project(itemProjection(true))
        .toArray();
      return serializeOrder(order, items, { includeInternal: true });
    })
  );
  return ordersWithItems;
}

export async function getOrderById(id, { includeInternal = false } = {}) {
  const orders = await getCollection("orders");
  const orderItems = await getCollection("order_items");
  const order = await orders.findOne({ id });
  if (!order) return null;
  const items = await orderItems
    .find({ order_id: order.id })
    .project(itemProjection(includeInternal))
    .toArray();
  return { ...serializeOrder(order, items, { includeInternal }), customer_id: order.customer_id };
}
