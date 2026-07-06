import 'dotenv/config';
import { getCollection, connectMongo } from '../src/db/mongo.js';

try {
  await connectMongo();
  const carts = await getCollection('carts');
  await carts.createIndex({ customer_id: 1 }, { unique: true });
  console.log('MongoDB carts index ensured.');
} catch (err) {
  console.error('create-carts failed:', err.message || err);
  process.exit(1);
}
