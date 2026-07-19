import { getCollection } from "../../db/mongo.js";
import { notifyAdminLowStock } from "../notifications/notification.service.js";

export async function reserveStockForItems(items, orderId) {
  const products = await getCollection("products");
  const reserved = [];

  for (const item of items) {
    const quantity = Number(item.quantity || item.qty || 0);
    if (!item.product_id || quantity <= 0) continue;

    const result = await products.updateOne(
      { id: item.product_id, active: true, stock: { $gte: quantity } },
      {
        $inc: { stock: -quantity },
        $set: { updated_at: new Date() },
        $push: {
          stock_locks: {
            order_id: orderId,
            quantity,
            created_at: new Date()
          }
        }
      }
    );

    if (result.modifiedCount !== 1) {
      await releaseStockForItems(reserved, orderId);
      const error = new Error(`Insufficient stock for ${item.name || item.product_id}`);
      error.status = 409;
      throw error;
    }

    const product = await products.findOne(
      { id: item.product_id },
      { projection: { _id: 0, id: 1, name: 1, stock: 1, supplier_id: 1 } }
    );
    notifyAdminLowStock(product).catch((err) => console.error("[notification:low-stock]", err.message));

    reserved.push({ product_id: item.product_id, quantity });
  }

  return reserved;
}

export async function releaseStockForItems(items, orderId) {
  const products = await getCollection("products");

  for (const item of items) {
    const quantity = Number(item.quantity || item.qty || 0);
    if (!item.product_id || quantity <= 0) continue;
    await products.updateOne(
      { id: item.product_id },
      {
        $inc: { stock: quantity },
        $pull: { stock_locks: { order_id: orderId } },
        $set: { updated_at: new Date() }
      }
    );
  }
}

export async function releaseExpiredStockReservations({ olderThanMinutes = 60, limit = 100 } = {}) {
  const orders = await getCollection("orders");
  const orderItems = await getCollection("order_items");
  const cutoff = new Date(Date.now() - Number(olderThanMinutes || 60) * 60 * 1000);
  const rows = await orders
    .find({
      payment_status: "pending",
      stock_reserved: true,
      stock_released_at: { $exists: false },
      created_at: { $lte: cutoff }
    })
    .sort({ created_at: 1 })
    .limit(Number(limit || 100))
    .toArray();

  const released = [];
  for (const order of rows) {
    const items = await orderItems.find({ order_id: order.id }).toArray();
    await releaseStockForItems(items, order.id);
    await orders.updateOne(
      { id: order.id },
      {
        $set: {
          status: "Expired",
          payment_status: "expired",
          stock_released_at: new Date()
        }
      }
    );
    released.push(order.id);
  }

  return { released_count: released.length, released };
}
