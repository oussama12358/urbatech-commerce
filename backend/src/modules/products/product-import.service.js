import crypto from "crypto";
import ExcelJS from "exceljs";
import { env } from "../../config/env.js";
import { createId, getCollection } from "../../db/mongo.js";
import { notifyAdminLowStock } from "../notifications/notification.service.js";
import { normalizeCountryCodes } from "../../utils/shipping-countries.js";
import { normalizeCurrency } from "../currencies/currency.service.js";

const headerAliases = {
  name: ["name", "product", "product name", "title", "designation"],
  sku: ["sku", "reference", "ref", "product sku"],
  supplier_product_id: ["supplier product id", "supplier_product_id", "supplier sku", "sku", "id", "reference", "ref"],
  category: ["category", "categorie", "catégorie", "type"],
  description: ["description", "desc", "details", "detail"],
  price: ["price", "selling price", "sale price", "retail price", "prix", "selling_price"],
  cost_price: ["cost", "cost price", "supplier cost", "wholesale price", "prix achat", "cost_price"],
  currency: ["currency", "currency code", "devise", "base currency", "base_currency"],
  stock: ["stock", "quantity", "qty", "inventory", "disponible"],
  status: ["status", "availability", "etat", "état"],
  brand: ["brand", "marque"],
  manufacturer: ["manufacturer", "maker", "fabricant"],
  mpn: ["mpn", "manufacturer part number", "manufacturer_part_number", "part number", "part_number", "model", "modele", "modèle"],
  barcode: ["barcode", "ean", "upc", "gtin", "code barre", "code_barre"],
  warranty: ["warranty", "garantie"],
  lead: ["lead", "lead time", "delivery", "delivery time", "delai", "délai"],
  weight_kg: ["weight", "weight kg", "weight_kg", "poids"],
  length_cm: ["length", "length cm", "length_cm", "longueur"],
  width_cm: ["width", "width cm", "width_cm", "largeur"],
  height_cm: ["height", "height cm", "height_cm", "hauteur"],
  country_of_origin: ["country of origin", "origin", "country", "pays origine"],
  shipping_class: ["shipping class", "shipping_class", "classe livraison"],
  ships_to_countries: [
    "ships to",
    "ships to countries",
    "ships_to",
    "ships_to_countries",
    "available countries",
    "available_countries",
    "shipping countries",
    "shipping_countries",
    "countries",
    "pays livraison",
    "pays disponibles"
  ],
  vat_rate: ["vat", "vat rate", "vat_rate", "tax", "tax rate", "tva"],
  specs: ["specs", "specifications", "attributes", "features"],
  images: ["images", "image", "image urls", "image_urls", "photo", "photos"]
};

function slugify(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function normalizeHeader(value) {
  return String(value || "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const normalized = String(value).replace(/\s/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function splitList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(/\s*[|;]\s*|\s*,\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSupplierStatus(status, stock) {
  const value = String(status || "").trim().toLowerCase();
  if (value.includes("discontinued") || value.includes("deleted") || value.includes("removed") || value.includes("stopped")) {
    return "discontinued";
  }
  if (value.includes("inactive") || value.includes("disabled")) {
    return "inactive";
  }
  if (value.includes("out") || value.includes("rupture") || Number(stock || 0) <= 0) {
    return "out_of_stock";
  }
  return "active";
}

function makeDedupeKey(row, supplierId, supplierProductId) {
  const barcode = normalizeKey(row.barcode);
  if (barcode) return `barcode:${barcode}`;
  const mpn = normalizeKey(row.mpn);
  if (mpn) return `mpn:${mpn}`;
  const sku = normalizeKey(supplierProductId);
  if (sku) return `supplier-sku:${normalizeKey(supplierId)}:${sku}`;
  return `name:${slugify(row.name)}`;
}

function cellToText(cell) {
  const value = cell?.value;
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if (value.text) return String(value.text);
    if (value.result !== undefined && value.result !== null) return String(value.result);
    if (value.hyperlink && value.text) return String(value.text);
    if (Array.isArray(value.richText)) return value.richText.map((part) => part.text || "").join("");
  }
  return cell.text || String(value);
}

function detectDelimiter(line) {
  const candidates = [",", ";", "\t"];
  return candidates
    .map((delimiter) => ({ delimiter, count: line.split(delimiter).length }))
    .sort((a, b) => b.count - a.count)[0].delimiter;
}

function parseCsvLine(line, delimiter) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function parseCsv(text) {
  const lines = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line, delimiter);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
}

async function parseRows({ fileName, contentBase64, contentText }) {
  const extension = String(fileName || "").split(".").pop()?.toLowerCase();
  if (extension === "csv" || extension === "tsv") {
    const text = contentText || Buffer.from(contentBase64 || "", "base64").toString("utf8");
    return parseCsv(text);
  }

  if (extension === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(contentBase64 || "", "base64"));
    const worksheet = workbook.worksheets[0];
    if (!worksheet) return [];
    const headers = [];
    worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
      headers[colNumber - 1] = String(cell.value || "").trim();
    });
    const rows = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const item = {};
      headers.forEach((header, index) => {
        if (!header) return;
        const cell = row.getCell(index + 1);
        const value = cellToText(cell);
        item[header] = value;
      });
      if (Object.values(item).some((value) => String(value || "").trim())) {
        rows.push(item);
      }
    });
    return rows;
  }

  const error = new Error("Unsupported file type. Upload .xlsx or .csv.");
  error.status = 400;
  throw error;
}

function mapRow(row) {
  const normalized = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    normalized[normalizeHeader(key)] = value;
  });

  const get = (field) => {
    const aliases = headerAliases[field] || [field];
    for (const alias of aliases) {
      const value = normalized[normalizeHeader(alias)];
      if (value !== undefined && value !== null && value !== "") return value;
    }
    return "";
  };

  const price = toNumber(get("price"), 0);
  const costPrice = toNumber(get("cost_price"), price);
  const stock = Math.max(0, Math.floor(toNumber(get("stock"), 0)));
  const margin = price ? Math.round(((price - costPrice) / price) * 10000) / 100 : 0;
  const status = String(get("status") || "").trim() || (stock <= 0 ? "Out of stock" : stock <= env.lowStockThreshold ? "Low stock" : "In stock");

  return {
    name: String(get("name") || "").trim(),
    sku: String(get("sku") || get("supplier_product_id") || "").trim(),
    supplier_product_id: String(get("supplier_product_id") || "").trim(),
    category: String(get("category") || "").trim(),
    description: String(get("description") || "").trim(),
    price,
    base_price: price,
    base_currency: normalizeCurrency(get("currency") || "USD"),
    cost_price: costPrice,
    stock,
    margin: Math.max(0, margin),
    status,
    supplier_status: normalizeSupplierStatus(status, stock),
    brand: String(get("brand") || "").trim(),
    manufacturer: String(get("manufacturer") || "").trim(),
    mpn: String(get("mpn") || "").trim(),
    barcode: String(get("barcode") || "").trim(),
    weight_kg: toNumber(get("weight_kg"), 0),
    length_cm: toNumber(get("length_cm"), 0),
    width_cm: toNumber(get("width_cm"), 0),
    height_cm: toNumber(get("height_cm"), 0),
    country_of_origin: String(get("country_of_origin") || "").trim(),
    shipping_class: String(get("shipping_class") || "standard").trim().toLowerCase(),
    ships_to_countries: normalizeCountryCodes(splitList(get("ships_to_countries"))),
    vat_rate: toNumber(get("vat_rate"), 0),
    warranty: String(get("warranty") || "").trim(),
    lead: String(get("lead") || "").trim(),
    specs: splitList(get("specs")),
    images: splitList(get("images"))
  };
}

function validateProduct(row, rowNumber) {
  const errors = [];
  if (!row.name) errors.push("Missing product name.");
  // A stable source identifier is required for safe re-imports. Without it a
  // renamed product would look new and could be duplicated.
  if (!row.supplier_product_id) errors.push("Missing Supplier Product ID / SKU. Keep this value unchanged on future imports.");
  if (!row.price || row.price <= 0) errors.push("Missing or invalid price.");
  if (row.stock < 0) errors.push("Invalid stock.");
  return errors.length ? { row: rowNumber, errors } : null;
}

async function ensureCategoryId(name) {
  if (!name) return null;
  const categories = await getCollection("categories");
  const found = await categories.findOne({ name });
  if (found) return found.id;

  const baseSlug = slugify(name) || "category";
  let slug = baseSlug;
  let suffix = 1;
  while (await categories.findOne({ slug })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const category = { id: createId(), name, slug, created_at: new Date() };
  await categories.insertOne(category);
  return category.id;
}

function fallbackSupplierProductId(supplierId, row) {
  return `import-${crypto.createHash("sha1").update(`${supplierId}:${row.name}`).digest("hex").slice(0, 12)}`;
}

export async function previewSupplierProductImport({ fileName, contentBase64, contentText }) {
  const rows = await parseRows({ fileName, contentBase64, contentText });
  const mapped = rows.map((row, index) => ({ rowNumber: index + 2, product: mapRow(row) }));
  const errors = mapped.map(({ rowNumber, product }) => validateProduct(product, rowNumber)).filter(Boolean);
  const validRows = mapped.filter(({ rowNumber }) => !errors.some((error) => error.row === rowNumber));
  return {
    file_name: fileName,
    total_rows: mapped.length,
    valid_count: validRows.length,
    error_count: errors.length,
    errors: errors.slice(0, 50),
    sample: validRows.map(({ product }) => product)
  };
}

export async function importSupplierProducts({ supplierId, fileName, contentBase64, contentText, dryRun = true }) {
  const suppliers = await getCollection("suppliers");
  const supplier = await suppliers.findOne({ id: supplierId });
  if (!supplier) {
    const error = new Error("Supplier not found.");
    error.status = 404;
    throw error;
  }
  if (supplier.status === "Inactive") {
    const error = new Error("Supplier is inactive. Activate it before importing products.");
    error.status = 400;
    throw error;
  }

  const preview = await previewSupplierProductImport({ fileName, contentBase64, contentText });
  if (dryRun) return { ...preview, dry_run: true };

  if (!preview.valid_count) {
    const error = new Error("No valid products found in file.");
    error.status = 400;
    throw error;
  }

  const startedAt = Date.now();
  const rawRows = await parseRows({ fileName, contentBase64, contentText });
  const importBatchId = createId();
  const now = new Date();
  const products = await getCollection("products");
  const batches = await getCollection("product_import_batches");
  let created = 0;
  let updated = 0;
  let duplicateCandidates = 0;

  await batches.insertOne({
    id: importBatchId,
    supplier_id: supplierId,
    supplier_name: supplier.company_name || supplierId,
    file_name: fileName,
    source: "import",
    total_rows: preview.total_rows,
    valid_count: preview.valid_count,
    error_count: preview.error_count,
    skipped_count: preview.error_count,
    errors: preview.errors,
    status: "processing",
    created_at: now,
    updated_at: now
  });

  for (let index = 0; index < rawRows.length; index += 1) {
    const rowNumber = index + 2;
    const row = mapRow(rawRows[index]);
    if (validateProduct(row, rowNumber)) continue;

    const supplierProductId = row.supplier_product_id || fallbackSupplierProductId(supplierId, row);
    const existing = await products.findOne({ supplier_id: supplierId, supplier_product_id: supplierProductId });
    const dedupeKey = makeDedupeKey(row, supplierId, supplierProductId);
    const duplicateCandidate = await products.findOne({
      dedupe_key: dedupeKey,
      supplier_id: { $ne: supplierId },
      active: true
    });
    if (duplicateCandidate) duplicateCandidates += 1;

    const categoryId = await ensureCategoryId(row.category);
    const id = existing?.id || `${slugify(row.name) || "import-product"}-${String(supplierId).slice(0, 8)}-${supplierProductId}`.slice(0, 90);
    const productShipsTo = normalizeCountryCodes(row.ships_to_countries);
    const shipsToOverride = productShipsTo.length > 0;
    const shipsToCountries = shipsToOverride
      ? productShipsTo
      : normalizeCountryCodes(supplier.ships_to_countries);

    const result = await products.updateOne(
      { supplier_id: supplierId, supplier_product_id: supplierProductId },
      {
        $set: {
          id,
          supplier_id: supplierId,
          supplier_product_id: supplierProductId,
          product_source: "import",
          sku: row.sku || supplierProductId,
          category_id: categoryId,
          name: row.name,
          description: row.description,
          price: row.price,
          base_price: row.base_price,
          base_currency: row.base_currency,
          cost_price: row.cost_price,
          margin: row.margin,
          stock: row.stock,
          status: row.status,
          supplier_status: row.supplier_status,
          supplier_last_sync_at: now,
          brand: row.brand || null,
          manufacturer: row.manufacturer || row.brand || null,
          mpn: row.mpn || null,
          barcode: row.barcode || null,
          weight_kg: row.weight_kg || 0,
          dimensions: {
            length_cm: row.length_cm || 0,
            width_cm: row.width_cm || 0,
            height_cm: row.height_cm || 0
          },
          tax_included: false,
          vat_rate: row.vat_rate || 0,
          country_of_origin: row.country_of_origin || null,
          visibility: "visible",
          featured: false,
          shipping_class: row.shipping_class || "standard",
          ships_to_countries: shipsToCountries,
          ships_to_override: shipsToOverride,
          seo_title: row.name,
          seo_description: row.description || "",
          slug: slugify(row.name) || id,
          dedupe_key: dedupeKey,
          warranty: row.warranty || null,
          lead_time: row.lead || null,
          specs: row.specs,
          images: row.images,
          auto_sync: false,
          import_batch_id: importBatchId,
          active: true,
          updated_at: now
        },
        $setOnInsert: {
          created_at: now
        }
      },
      { upsert: true }
    );

    if (result.upsertedCount) created += 1;
    else updated += 1;
    notifyAdminLowStock({
      id,
      name: row.name,
      stock: row.stock,
      supplier_id: supplierId
    }).catch((err) => console.error("[notification:low-stock]", err.message));
  }

  await batches.updateOne(
    { id: importBatchId },
    {
      $set: {
        status: "completed",
        imported_count: created + updated,
        created_count: created,
        updated_count: updated,
        skipped_count: preview.error_count,
        duplicate_candidates_count: duplicateCandidates,
        duration_ms: Date.now() - startedAt,
        completed_at: new Date(),
        updated_at: new Date()
      }
    }
  );
  await suppliers.updateOne(
    { id: supplierId },
    {
      $set: {
        products_count: await products.countDocuments({ supplier_id: supplierId, active: true }),
        last_sync_at: new Date(),
        updated_at: new Date()
      }
    }
  );

  return {
    ...preview,
    dry_run: false,
    import_batch_id: importBatchId,
    imported_count: created + updated,
    created_count: created,
    updated_count: updated,
    skipped_count: preview.error_count,
    duplicate_candidates_count: duplicateCandidates,
    duration_ms: Date.now() - startedAt
  };
}

export async function listSupplierProductImports({ supplierId, limit = 20 } = {}) {
  const batches = await getCollection("product_import_batches");
  return batches
    .find({ supplier_id: supplierId })
    .project({ _id: 0 })
    .sort({ created_at: -1 })
    .limit(Number(limit || 20))
    .toArray();
}
