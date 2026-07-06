import 'dotenv/config';
import { connectMongo, getCollection } from '../src/db/mongo.js';

try {
  await connectMongo();
  console.log('Connected to MongoDB.');

  const settings = await getCollection('app_settings');
  await settings.updateOne(
    { key: 'storefront_enabled' },
    { $setOnInsert: { key: 'storefront_enabled', value: true, updated_at: new Date() } },
    { upsert: true }
  );

  const carts = await getCollection('carts');
  await carts.createIndex({ customer_id: 1 }, { unique: true });

  console.log('MongoDB database setup complete.');
} catch (err) {
  console.error('MongoDB setup failed:', err.message || err);
  process.exit(1);
}
