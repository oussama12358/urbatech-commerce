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
  await database.collection("customers").createIndex({ email: 1 }, { unique: true });
  await database.collection("customers").createIndex({ id: 1 }, { unique: true });
  await database.collection("products").createIndex({ id: 1 }, { unique: true });
  await database.collection("products").createIndex({ supplier_id: 1 });
  await database.collection("products").createIndex(
    { supplier_id: 1, supplier_product_id: 1 },
    { unique: true, partialFilterExpression: { supplier_id: { $exists: true }, supplier_product_id: { $exists: true } } }
  );
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
  await database.collection("refunds").createIndex({ id: 1 }, { unique: true });
  await database.collection("refunds").createIndex({ order_id: 1 });
  await database.collection("app_settings").createIndex({ key: 1 }, { unique: true });
  await database.collection("payment_providers").createIndex({ provider_key: 1 }, { unique: true });
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
