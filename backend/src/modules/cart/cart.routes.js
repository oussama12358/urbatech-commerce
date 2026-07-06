import { Router } from "express";
import { getCollection } from "../../db/mongo.js";
import { requireAuth } from "../../middleware/auth.js";

export const cartRouter = Router();

// Get current user's cart (object map id -> qty)
cartRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const carts = await getCollection("carts");
    const cart = await carts.findOne({ customer_id: req.user.id });
    res.json({ data: cart?.items || {} });
  } catch (err) {
    next(err);
  }
});

// Save/replace current user's cart
cartRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const items = req.body || {};
    const carts = await getCollection("carts");
    await carts.updateOne(
      { customer_id: req.user.id },
      { $set: { customer_id: req.user.id, items, updated_at: new Date() } },
      { upsert: true }
    );
    res.status(201).json({ data: items });
  } catch (err) {
    next(err);
  }
});

// Clear cart
cartRouter.delete("/", requireAuth, async (req, res, next) => {
  try {
    const carts = await getCollection("carts");
    await carts.deleteOne({ customer_id: req.user.id });
    res.json({ data: {} });
  } catch (err) {
    next(err);
  }
});
