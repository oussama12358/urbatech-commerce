import { Router } from "express";
import { z } from "zod";
import { getCollection, createId } from "../../db/mongo.js";
import { requireAuth, requireRole, optionalAuth } from "../../middleware/auth.js";
import { normalizeCountryCodes, resolveShipsToCountries } from "../../utils/shipping-countries.js";

const createProductSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(1).optional(),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  margin: z.number().nonnegative(),
  status: z.string().min(1).optional(),
  description: z.string().optional(),
  long_description: z.string().optional(),
  desc: z.string().optional(),
  lead: z.string().optional(),
  warranty: z.string().optional(),
  specs: z.array(z.string()).optional(),
  sku: z.string().optional(),
  images: z.array(z.string()).optional(),
  supplier_id: z.string().optional(),
  supplier_product_id: z.string().optional(),
  product_source: z.enum(["api", "import", "internal"]).optional(),
  supplier_status: z.enum(["active", "inactive", "discontinued", "out_of_stock"]).optional(),
  brand: z.string().optional(),
  manufacturer: z.string().optional(),
  mpn: z.string().optional(),
  barcode: z.string().optional(),
  weight_kg: z.number().nonnegative().optional(),
  length_cm: z.number().nonnegative().optional(),
  width_cm: z.number().nonnegative().optional(),
  height_cm: z.number().nonnegative().optional(),
  tax_included: z.boolean().optional(),
  vat_rate: z.number().nonnegative().optional(),
  country_of_origin: z.string().optional(),
  visibility: z.enum(["visible", "hidden", "draft"]).optional(),
  featured: z.boolean().optional(),
  shipping_class: z.string().optional(),
  ships_to_countries: z.array(z.string()).optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  slug: z.string().optional(),
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

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function makeDedupeKey(product, id) {
  const barcode = normalizeKey(product.barcode);
  if (barcode) return `barcode:${barcode}`;
  const mpn = normalizeKey(product.mpn);
  if (mpn) return `mpn:${mpn}`;
  const supplierSku = normalizeKey(product.supplier_product_id);
  const supplierId = normalizeKey(product.supplier_id);
  if (supplierId && supplierSku) return `supplier-sku:${supplierId}:${supplierSku}`;
  return `local:${id}`;
}

function generateSku() {
  return `UT-${createId().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function productVisibilityQuery(includeInternal = false) {
  const query = { active: true };
  if (!includeInternal) {
    query.supplier_status = { $nin: ["inactive", "discontinued"] };
    query.status = { $nin: ["Inactive", "Draft", "inactive", "draft"] };
    query.visibility = { $nin: ["hidden", "draft"] };
  }
  return query;
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

function serializeProduct(product, categoryName = null, includeInternal = false, supplier = null) {
  const shipsTo = resolveShipsToCountries(product, supplier);
  const serialized = {
    id: product.id,
    name: product.name,
    description: product.description,
    long_description: product.long_description || "",
    desc: product.description,
    price: product.price,
    stock: product.stock,
    status: product.status,
    warranty: product.warranty,
    lead: product.lead_time,
    specs: product.specs || [],
    images: product.images || [],
    category: categoryName,
    sku: product.sku || "",
    brand: product.brand || "",
    manufacturer: product.manufacturer || "",
    barcode: product.barcode || "",
    featured: Boolean(product.featured),
    shipping_class: product.shipping_class || "standard",
    weight_kg: product.weight_kg || 0,
    dimensions: product.dimensions || null,
    // Empty/null ships_to_countries + ships_worldwide=true means available everywhere
    ships_to_countries: shipsTo || [],
    ships_worldwide: !shipsTo || shipsTo.length === 0
  };

  if (includeInternal) {
    serialized.cost_price = product.cost_price || 0;
    serialized.margin = product.margin || 0;
    serialized.auto_sync = Boolean(product.auto_sync);
    serialized.supplier_id = product.supplier_id || null;
    serialized.supplier_product_id = product.supplier_product_id || "";
    serialized.product_source = product.product_source || (product.supplier_id ? "api" : "internal");
    serialized.import_batch_id = product.import_batch_id || null;
    serialized.supplier_status = product.supplier_status || "active";
    serialized.supplier_last_sync_at = product.supplier_last_sync_at || null;
    serialized.mpn = product.mpn || "";
    serialized.dedupe_key = product.dedupe_key || "";
    serialized.weight_kg = product.weight_kg || 0;
    serialized.dimensions = product.dimensions || { length_cm: 0, width_cm: 0, height_cm: 0 };
    serialized.tax_included = Boolean(product.tax_included);
    serialized.vat_rate = product.vat_rate || 0;
    serialized.country_of_origin = product.country_of_origin || "";
    serialized.visibility = product.visibility || "visible";
    serialized.featured = Boolean(product.featured);
    serialized.shipping_class = product.shipping_class || "standard";
    serialized.ships_to_override = Boolean(product.ships_to_override);
    serialized.seo_title = product.seo_title || "";
    serialized.seo_description = product.seo_description || "";
    serialized.slug = product.slug || product.id;
  }

  return serialized;
}

async function loadSupplierMap(supplierIds = []) {
  const ids = [...new Set(supplierIds.filter(Boolean))];
  if (!ids.length) return {};
  const suppliers = await getCollection("suppliers");
  const docs = await suppliers.find({ id: { $in: ids } }).toArray();
  return docs.reduce((map, supplier) => {
    map[supplier.id] = supplier;
    return map;
  }, {});
}

async function getProductById(id, includeInternal = false) {
  const products = await getCollection("products");
  const categories = await getCollection("categories");
  const product = await products.findOne({ ...productVisibilityQuery(includeInternal), id });
  if (!product) return null;

  const category = product.category_id ? await categories.findOne({ id: product.category_id }) : null;
  const supplierMap = await loadSupplierMap([product.supplier_id]);
  return serializeProduct(product, category?.name || null, includeInternal, supplierMap[product.supplier_id] || null);
}

productsRouter.get("/", async (req, res, next) => {
  try {
    const products = await getCollection("products");
    const categories = await getCollection("categories");
    const includeInternal = req.user?.role?.toLowerCase() === "admin";
    const rows = await products
      .find(productVisibilityQuery(includeInternal))
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

    const supplierMap = await loadSupplierMap(rows.map((product) => product.supplier_id));

    res.json({
      data: rows.map((product) =>
        serializeProduct(
          product,
          categoryMap[product.category_id] || null,
          includeInternal,
          supplierMap[product.supplier_id] || null
        )
      )
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
    const slug = slugify(payload.slug || payload.name) || "product";
    const id = `${slug}-${Date.now().toString().slice(-4)}`;
    const specs = payload.specs || [];
    const description = payload.description ?? payload.desc ?? null;
    const products = await getCollection("products");
    const source = payload.product_source || (payload.supplier_id ? "api" : "internal");
    const supplierStatus = payload.supplier_status || "active";
    const product = {
      id,
      category_id: categoryId,
      sku: payload.sku || generateSku(),
      name: payload.name,
      description,
      long_description: payload.long_description || "",
      price: payload.price,
      margin: payload.margin || 0,
      cost_price: payload.cost_price || 0,
      stock: payload.stock || 0,
      supplier_id: payload.supplier_id || null,
      supplier_product_id: payload.supplier_product_id || null,
      product_source: source,
      supplier_status: supplierStatus,
      supplier_last_sync_at: source === "internal" ? null : new Date(),
      brand: payload.brand || null,
      manufacturer: payload.manufacturer || payload.brand || null,
      mpn: payload.mpn || null,
      barcode: payload.barcode || null,
      weight_kg: payload.weight_kg || 0,
      dimensions: {
        length_cm: payload.length_cm || 0,
        width_cm: payload.width_cm || 0,
        height_cm: payload.height_cm || 0
      },
      tax_included: Boolean(payload.tax_included),
      vat_rate: payload.vat_rate || 0,
      country_of_origin: payload.country_of_origin || null,
      visibility: payload.visibility || "visible",
      featured: Boolean(payload.featured),
      shipping_class: payload.shipping_class || "standard",
      ships_to_countries: normalizeCountryCodes(payload.ships_to_countries),
      ships_to_override: normalizeCountryCodes(payload.ships_to_countries).length > 0,
      seo_title: payload.seo_title || payload.name,
      seo_description: payload.seo_description || description || "",
      slug,
      dedupe_key: makeDedupeKey(payload, id),
      auto_sync: Boolean(payload.auto_sync),
      status: payload.status || "In stock",
      warranty: payload.warranty || null,
      lead_time: payload.lead || null,
      specs,
      images: payload.images || [],
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
    const existing = await getProductById(req.params.id, true);
    if (!existing) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const categoryId = Object.prototype.hasOwnProperty.call(payload, "category")
      ? await ensureCategoryId(payload.category)
      : undefined;
    const specs = Array.isArray(payload.specs) ? payload.specs : undefined;
    const description = payload.description ?? payload.desc;
    const dimensions = (
      payload.length_cm !== undefined ||
      payload.width_cm !== undefined ||
      payload.height_cm !== undefined
    )
      ? {
          length_cm: payload.length_cm || 0,
          width_cm: payload.width_cm || 0,
          height_cm: payload.height_cm || 0
        }
      : undefined;

    const updateDoc = {
      ...(categoryId !== undefined ? { category_id: categoryId } : {}),
      ...(payload.sku !== undefined ? { sku: payload.sku || null } : {}),
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(payload.long_description !== undefined ? { long_description: payload.long_description || "" } : {}),
      ...(payload.price !== undefined ? { price: payload.price } : {}),
      ...(payload.margin !== undefined ? { margin: payload.margin } : {}),
      ...(payload.cost_price !== undefined ? { cost_price: payload.cost_price } : {}),
      ...(payload.stock !== undefined ? { stock: payload.stock } : {}),
      ...(payload.supplier_id !== undefined ? { supplier_id: payload.supplier_id || null } : {}),
      ...(payload.supplier_product_id !== undefined ? { supplier_product_id: payload.supplier_product_id || null } : {}),
      ...(payload.product_source !== undefined ? { product_source: payload.product_source } : {}),
      ...(payload.supplier_status !== undefined ? { supplier_status: payload.supplier_status } : {}),
      ...(payload.brand !== undefined ? { brand: payload.brand || null } : {}),
      ...(payload.manufacturer !== undefined ? { manufacturer: payload.manufacturer || payload.brand || null } : {}),
      ...(payload.mpn !== undefined ? { mpn: payload.mpn || null } : {}),
      ...(payload.barcode !== undefined ? { barcode: payload.barcode || null } : {}),
      ...(payload.weight_kg !== undefined ? { weight_kg: payload.weight_kg || 0 } : {}),
      ...(dimensions !== undefined ? { dimensions } : {}),
      ...(payload.tax_included !== undefined ? { tax_included: Boolean(payload.tax_included) } : {}),
      ...(payload.vat_rate !== undefined ? { vat_rate: payload.vat_rate || 0 } : {}),
      ...(payload.country_of_origin !== undefined ? { country_of_origin: payload.country_of_origin || null } : {}),
      ...(payload.visibility !== undefined ? { visibility: payload.visibility } : {}),
      ...(payload.featured !== undefined ? { featured: Boolean(payload.featured) } : {}),
      ...(payload.shipping_class !== undefined ? { shipping_class: payload.shipping_class || "standard" } : {}),
      ...(payload.ships_to_countries !== undefined
        ? {
            ships_to_countries: normalizeCountryCodes(payload.ships_to_countries),
            ships_to_override: normalizeCountryCodes(payload.ships_to_countries).length > 0
          }
        : {}),
      ...(payload.seo_title !== undefined ? { seo_title: payload.seo_title || "" } : {}),
      ...(payload.seo_description !== undefined ? { seo_description: payload.seo_description || "" } : {}),
      ...(payload.slug !== undefined ? { slug: slugify(payload.slug) || req.params.id } : {}),
      ...(payload.images !== undefined ? { images: payload.images || [] } : {}),
      ...(payload.auto_sync !== undefined ? { auto_sync: Boolean(payload.auto_sync) } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.warranty !== undefined ? { warranty: payload.warranty } : {}),
      ...(payload.lead !== undefined ? { lead_time: payload.lead } : {}),
      ...(specs !== undefined ? { specs } : {}),
      updated_at: new Date()
    };

    if (
      payload.barcode !== undefined ||
      payload.mpn !== undefined ||
      payload.supplier_id !== undefined ||
      payload.supplier_product_id !== undefined
    ) {
      updateDoc.dedupe_key = makeDedupeKey({ ...existing, ...payload }, req.params.id);
    }

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
