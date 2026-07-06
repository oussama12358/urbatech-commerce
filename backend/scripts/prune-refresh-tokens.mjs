#!/usr/bin/env node
import { connectMongo, getCollection } from "../src/db/mongo.js";

async function prune() {
  const client = await connectMongo();
  try {
    const customers = await getCollection("customers");
    const now = new Date();
    const result = await customers.updateMany(
      { "refreshTokens.expiresAt": { $lte: now } },
      { $pull: { refreshTokens: { expiresAt: { $lte: now } } } }
    );
    console.log(`Pruned refresh tokens from ${result.modifiedCount} user(s)`);
  } catch (err) {
    console.error("Prune failed:", err);
    process.exitCode = 2;
  } finally {
    await client.close();
  }
}

prune();
