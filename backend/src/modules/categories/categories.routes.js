import { Router } from "express";
import { z } from "zod";
import { getCollection, createId } from "../../db/mongo.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";

const categorySchema = z.object({
  name: z.string().min(2)
});

export const categoriesRouter = Router();

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function uniqueSlug(name, currentId) {
  const categories = await getCollection("categories");
  const baseSlug = slugify(name) || "category";
  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const query = { slug };
    if (currentId) {
      query.id = { $ne: currentId };
    }
    const existing = await categories.findOne(query);
    if (!existing) return slug;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
}

async function listCategories() {
  const categories = await getCollection("categories");
  const products = await getCollection("products");
  const rows = await categories.find().sort({ name: 1 }).toArray();
  const categoryIds = rows.map((category) => category.id);
  const counts = categoryIds.length
    ? await products
        .aggregate([
          { $match: { category_id: { $in: categoryIds }, active: true } },
          { $group: { _id: "$category_id", count: { $sum: 1 } } }
        ])
        .toArray()
    : [];
  const countMap = counts.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  return rows.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    product_count: countMap[category.id] || 0
  }));
}

categoriesRouter.get("/", async (_req, res, next) => {
  try {
    res.json({ data: await listCategories() });
  } catch (err) {
    next(err);
  }
});

categoriesRouter.post("/", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const payload = categorySchema.parse(req.body);
    const categories = await getCollection("categories");
    const existing = await categories.findOne({ name: new RegExp(`^${escapeRegExp(payload.name)}$`, "i") });
    if (existing) {
      res.status(409).json({ error: "Category already exists" });
      return;
    }

    const slug = await uniqueSlug(payload.name);
    const category = {
      id: createId(),
      name: payload.name,
      slug,
      created_at: new Date()
    };
    await categories.insertOne(category);
    res.status(201).json({ data: { ...category, product_count: 0 } });
  } catch (err) {
    next(err);
  }
});

categoriesRouter.put("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const payload = categorySchema.parse(req.body);
    const categories = await getCollection("categories");
    const duplicate = await categories.findOne({
      name: new RegExp(`^${escapeRegExp(payload.name)}$`, "i"),
      id: { $ne: req.params.id }
    });
    if (duplicate) {
      res.status(409).json({ error: "Category already exists" });
      return;
    }

    const slug = await uniqueSlug(payload.name, req.params.id);
    const result = await categories.findOneAndUpdate(
      { id: req.params.id },
      { $set: { name: payload.name, slug } },
      { returnDocument: "after" }
    );
    if (!result.value) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    res.json({ data: (await listCategories()).find((category) => category.id === req.params.id) });
  } catch (err) {
    next(err);
  }
});

categoriesRouter.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const categories = await getCollection("categories");
    const products = await getCollection("products");
    const carts = await getCollection("carts");

    const category = await categories.findOne({ id: req.params.id });
    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    const categoryProducts = await products.find({ category_id: req.params.id, active: true }).project({ id: 1 }).toArray();
    const deletedProductIds = categoryProducts.map((product) => product.id);

    if (deletedProductIds.length) {
      await products.updateMany(
        { category_id: req.params.id, active: true },
        { $set: { active: false, deleted_at: new Date() } }
      );

      const unsetCartItems = deletedProductIds.reduce((acc, productId) => {
        acc[`items.${productId}`] = "";
        return acc;
      }, {});
      await carts.updateMany({}, { $unset: unsetCartItems });
    }

    await categories.deleteOne({ id: req.params.id });

    res.json({
      data: {
        id: req.params.id,
        deletedProductIds,
        deletedProductCount: deletedProductIds.length
      }
    });
  } catch (err) {
    next(err);
  }
});
