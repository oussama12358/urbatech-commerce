import { getCollection } from "../../db/mongo.js";

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
