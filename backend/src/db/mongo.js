import crypto from "crypto";
import { MongoClient } from "mongodb";
import { env } from "../config/env.js";

const client = new MongoClient(env.mongoUrl);

let db;
let indexesEnsured = false;

async function connectWithRetry(attempts = 5, delayMs = 1000) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      await client.connect();
      return;
    } catch (err) {
      lastErr = err;
      // eslint-disable-next-line no-console
      console.warn(`[mongo] connect attempt ${i + 1} failed: ${err && err.message}. Retrying in ${delayMs}ms`);
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
  throw lastErr;
}

async function getDb() {
  if (!db) {
    await connectWithRetry();
    db = client.db();
  }

  if (!indexesEnsured) {
    await ensureIndexes();
    indexesEnsured = true;
  }

  return db;
}

async function ensureIndexes() {
  const database = client.db();
  await ensureSupplierProductIndex(database);
  await database.collection("customers").createIndex({ email: 1 }, { unique: true });
  await database.collection("customers").createIndex({ id: 1 }, { unique: true });
  await database.collection("products").createIndex({ id: 1 }, { unique: true });
  await database.collection("products").createIndex({ supplier_id: 1 });
  await database.collection("products").createIndex({ product_source: 1 });
  await database.collection("products").createIndex({ supplier_status: 1 });
  await database.collection("products").createIndex({ supplier_last_sync_at: -1 });
  await database.collection("products").createIndex({ dedupe_key: 1 });
  await database.collection("products").createIndex({ barcode: 1 }, { sparse: true });
  await database.collection("products").createIndex({ mpn: 1 }, { sparse: true });
  await database.collection("products").createIndex({ sku: 1 }, { sparse: true });
  await database.collection("products").createIndex({ slug: 1 }, { sparse: true });
  await database.collection("products").createIndex({ visibility: 1 });
  await database.collection("products").createIndex({ featured: 1 });
  await database.collection("suppliers").createIndex({ id: 1 }, { unique: true });
  await database.collection("suppliers").createIndex({ company_name: 1 }, { unique: true });
  await database.collection("categories").createIndex({ id: 1 }, { unique: true });
  await database.collection("categories").createIndex({ name: 1 }, { unique: true });
  await database.collection("categories").createIndex({ slug: 1 }, { unique: true });
  await database.collection("carts").createIndex({ customer_id: 1 }, { unique: true });
  await database.collection("orders").createIndex({ id: 1 }, { unique: true });
  await database.collection("orders").createIndex({ customer_id: 1 });
  await database.collection("orders").createIndex({ supplier_id: 1 });
  await database.collection("orders").createIndex({ supplier_order_id: 1 });
  await database.collection("orders").createIndex({ "supplier_dispatches.supplier_order_id": 1 });
  await database.collection("order_items").createIndex({ order_id: 1 });
  await database.collection("order_items").createIndex({ supplier_id: 1 });
  await database.collection("supplier_dispatch_jobs").createIndex({ order_id: 1, supplier_id: 1 }, { unique: true });
  await database.collection("supplier_dispatch_jobs").createIndex({ status: 1, next_attempt_at: 1 });
  await database.collection("supplier_settlements").createIndex({ id: 1 }, { unique: true });
  await database.collection("supplier_settlements").createIndex({ order_id: 1, supplier_id: 1 }, { unique: true });
  await database.collection("supplier_settlements").createIndex({ status: 1, created_at: -1 });
  await database.collection("product_import_batches").createIndex({ id: 1 }, { unique: true });
  await database.collection("product_import_batches").createIndex({ supplier_id: 1, created_at: -1 });
  await database.collection("refunds").createIndex({ id: 1 }, { unique: true });
  await database.collection("refunds").createIndex({ order_id: 1 });
  await database.collection("email_notifications").createIndex({ dedupe_key: 1 }, { sparse: true });
  await database.collection("email_notifications").createIndex({ type: 1, created_at: -1 });
  await database.collection("email_notifications").createIndex({ status: 1, created_at: -1 });
  await database.collection("app_settings").createIndex({ key: 1 }, { unique: true });
  await database.collection("payment_providers").createIndex({ provider_key: 1 }, { unique: true });
}

async function ensureSupplierProductIndex(database) {
  const products = database.collection("products");
  const indexName = "supplier_id_1_supplier_product_id_1";
  const desiredPartial = {
    supplier_id: { $type: "string" },
    supplier_product_id: { $type: "string" }
  };
  const existing = (await products.indexes()).find((index) => index.name === indexName);

  if (
    existing?.partialFilterExpression &&
    JSON.stringify(existing.partialFilterExpression) !== JSON.stringify(desiredPartial)
  ) {
    await products.dropIndex(indexName);
  }

  await products.createIndex(
    { supplier_id: 1, supplier_product_id: 1 },
    { unique: true, partialFilterExpression: desiredPartial }
  );
}

export function createId() {
  return crypto.randomUUID();
}

export async function getCollection(name) {
  const database = await getDb();
  return database.collection(name);
}

export async function connectMongo() {
  await getDb();
  return client;
}
