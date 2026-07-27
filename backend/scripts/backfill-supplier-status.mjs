import 'dotenv/config';
import { connectMongo, getCollection } from '../src/db/mongo.js';

async function main() {
  await connectMongo();
  const products = await getCollection('products');

  const query = { supplier_status: { $exists: false } };
  const update = { $set: { supplier_status: 'active', updated_at: new Date() } };

  const result = await products.updateMany(query, update);
  console.log(`Matched ${result.matchedCount}, modified ${result.modifiedCount}`);

  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
