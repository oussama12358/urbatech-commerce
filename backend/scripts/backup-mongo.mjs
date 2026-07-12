import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { connectMongo } from "../src/db/mongo.js";

const collections = (process.env.BACKUP_COLLECTIONS || "customers,products,categories,suppliers,orders,order_items,supplier_dispatch_jobs,supplier_settlements,refunds,app_settings,payment_providers")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const outDir = process.env.BACKUP_DIR || path.join(process.cwd(), "backups");
const fileName = `mongo-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;

const client = await connectMongo();
try {
  const database = client.db();
  const backup = { created_at: new Date().toISOString(), collections: {} };
  for (const name of collections) {
    backup.collections[name] = await database.collection(name).find().toArray();
  }
  await fs.mkdir(outDir, { recursive: true });
  const filePath = path.join(outDir, fileName);
  await fs.writeFile(filePath, JSON.stringify(backup, null, 2));
  console.log(JSON.stringify({ ok: true, file: filePath, collections }, null, 2));
} finally {
  await client.close();
}
