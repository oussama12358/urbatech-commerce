import { Router } from "express";
import { z } from "zod";
import { getCollection, createId } from "../../db/mongo.js";
import { requireAuth, requireRole, optionalAuth } from "../../middleware/auth.js";

const createProductSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(1).optional(),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  margin: z.number().nonnegative(),
  status: z.string().min(1).optional(),
  description: z.string().optional(),
  desc: z.string().optional(),
  lead: z.string().optional(),
  warranty: z.string().optional(),
  specs: z.array(z.string()).optional(),
  supplier_id: z.string().optional(),
  supplier_product_id: z.string().optional(),
  cost_price: z.number().nonnegative().optional(),
  auto_sync: z.boolean().optional()
});

const updateProductSchema = createProductSchema.partial();

export const productsRouter = Router();

productsRouter.use(optionalAuth);

const productSelect = null;

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function ensureCategoryId(name) {
  if (!name) return null;

  const categories = await getCollection("categories");
  const found = await categories.findOne({ name });
  if (found) return found.id;

  const baseSlug = slugify(name) || "category";
  let slug = baseSlug;
  let suffix = 1;
  while (true) {
    const existingSlug = await categories.findOne({ slug });
    if (!existingSlug) break;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const category = {
    id: createId(),
    name,
    slug,
    created_at: new Date()
  };
  await categories.insertOne(category);
  return category.id;
}

function serializeProduct(product, categoryName = null, includeInternal = false) {
  const serialized = {
    id: product.id,
    name: product.name,
    description: product.description,
    desc: product.description,
    price: product.price,
    stock: product.stock,
    status: product.status,
    warranty: product.warranty,
    lead: product.lead_time,
    specs: product.specs || [],
    images: product.images || [],
    category: categoryName
  };

  if (includeInternal) {
    serialized.cost_price = product.cost_price || 0;
    serialized.margin = product.margin || 0;
    serialized.auto_sync = Boolean(product.auto_sync);
    serialized.supplier_id = product.supplier_id || null;
    serialized.supplier_product_id = product.supplier_product_id || "";
  }

  return serialized;
}

async function getProductById(id, includeInternal = false) {
  const products = await getCollection("products");
  const categories = await getCollection("categories");
  const product = await products.findOne({ id, active: true });
  if (!product) return null;

  const category = product.category_id ? await categories.findOne({ id: product.category_id }) : null;
  return serializeProduct(product, category?.name || null, includeInternal);
}

productsRouter.get("/", async (req, res, next) => {
  try {
    const products = await getCollection("products");
    const categories = await getCollection("categories");
    const rows = await products
      .find({ active: true })
      .sort({ created_at: -1 })
      .limit(500)
      .toArray();

    const categoryMap = {};
    const categoryIds = [...new Set(rows.map((product) => product.category_id).filter(Boolean))];
    if (categoryIds.length) {
      const categoryDocs = await categories.find({ id: { $in: categoryIds } }).toArray();
      categoryDocs.forEach((cat) => {
        categoryMap[cat.id] = cat.name;
      });
    }

    const includeInternal = req.user?.role?.toLowerCase() === "admin";
    res.json({
      data: rows.map((product) => serializeProduct(product, categoryMap[product.category_id] || null, includeInternal))
    });
  } catch (err) {
    next(err);
  }
});

productsRouter.get("/:id", async (req, res, next) => {
  try {
    const product = await getProductById(req.params.id, req.user?.role?.toLowerCase() === "admin");
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
});

productsRouter.post("/", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const payload = createProductSchema.parse(req.body);

    const categoryId = await ensureCategoryId(payload.category);
    const id = (slugify(payload.name) || "product") + "-" + Date.now().toString().slice(-4);
    const specs = payload.specs || [];
    const description = payload.description ?? payload.desc ?? null;
    const products = await getCollection("products");
    const product = {
      id,
      category_id: categoryId,
      name: payload.name,
      description,
      price: payload.price,
      margin: payload.margin || 0,
      cost_price: payload.cost_price || 0,
      stock: payload.stock || 0,
      supplier_id: payload.supplier_id || null,
      supplier_product_id: payload.supplier_product_id || null,
      auto_sync: Boolean(payload.auto_sync),
      status: payload.status || "In stock",
      warranty: payload.warranty || null,
      lead_time: payload.lead || null,
      specs,
      images: [],
      active: true,
      created_at: new Date()
    };
    await products.insertOne(product);

    res.status(201).json({ data: await getProductById(id, true) });
  } catch (err) {
    next(err);
  }
});

productsRouter.put("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const payload = updateProductSchema.parse(req.body);
    const existing = await getProductById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const categoryId = Object.prototype.hasOwnProperty.call(payload, "category")
      ? await ensureCategoryId(payload.category)
      : undefined;
    const specs = Array.isArray(payload.specs) ? payload.specs : undefined;
    const description = payload.description ?? payload.desc;

    const updateDoc = {
      ...(categoryId !== undefined ? { category_id: categoryId } : {}),
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(payload.price !== undefined ? { price: payload.price } : {}),
      ...(payload.margin !== undefined ? { margin: payload.margin } : {}),
      ...(payload.cost_price !== undefined ? { cost_price: payload.cost_price } : {}),
      ...(payload.stock !== undefined ? { stock: payload.stock } : {}),
      ...(payload.supplier_id !== undefined ? { supplier_id: payload.supplier_id || null } : {}),
      ...(payload.supplier_product_id !== undefined ? { supplier_product_id: payload.supplier_product_id || null } : {}),
      ...(payload.auto_sync !== undefined ? { auto_sync: Boolean(payload.auto_sync) } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.warranty !== undefined ? { warranty: payload.warranty } : {}),
      ...(payload.lead !== undefined ? { lead_time: payload.lead } : {}),
      ...(specs !== undefined ? { specs } : {})
    };

    const products = await getCollection("products");
    const result = await products.findOneAndUpdate(
      { id: req.params.id, active: true },
      { $set: updateDoc },
      { returnDocument: "after" }
    );

    if (!result.value) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json({ data: await getProductById(req.params.id, true) });
  } catch (err) {
    next(err);
  }
});

productsRouter.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const products = await getCollection("products");
    const result = await products.findOneAndUpdate(
      { id: req.params.id, active: true },
      { $set: { active: false } },
      { returnDocument: "after" }
    );
    if (!result.value) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json({ data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
});
