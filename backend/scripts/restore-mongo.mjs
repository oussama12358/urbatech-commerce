import "dotenv/config";
import fs from "node:fs/promises";
import { connectMongo } from "../src/db/mongo.js";

const file = process.env.BACKUP_FILE;
if (!file) {
  console.error("BACKUP_FILE is required.");
  process.exit(1);
}
if (process.env.CONFIRM_RESTORE !== "true") {
  console.error("Refusing to restore without CONFIRM_RESTORE=true.");
  process.exit(1);
}

const raw = await fs.readFile(file, "utf8");
const backup = JSON.parse(raw);
const client = await connectMongo();
try {
  const database = client.db();
  for (const [name, docs] of Object.entries(backup.collections || {})) {
    await database.collection(name).deleteMany({});
    if (Array.isArray(docs) && docs.length) {
      await database.collection(name).insertMany(docs);
    }
  }
  console.log(JSON.stringify({ ok: true, restored_collections: Object.keys(backup.collections || {}) }, null, 2));
} finally {
  await client.close();
}
