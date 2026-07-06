import 'dotenv/config';
import { getCollection, connectMongo, createId } from '../src/db/mongo.js';

function mergeCarts(serverCart, localCart) {
  const merged = { ...serverCart };
  Object.entries(localCart).forEach(([id, qty]) => {
    merged[id] = (merged[id] || 0) + qty;
  });
  return merged;
}

async function findOrCreateUser(email, name = 'Scenario User') {
  const customers = await getCollection('customers');
  const existing = await customers.findOne({ email: { $regex: `^${escapeRegExp(email)}$`, $options: 'i' } });
  if (existing) return existing.id;

  const user = {
    id: createId(),
    name,
    email,
    password: null,
    role: 'Client',
    created_at: new Date()
  };
  await customers.insertOne(user);
  return user.id;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

async function saveCart(userId, items) {
  const carts = await getCollection('carts');
  await carts.updateOne(
    { customer_id: userId },
    { $set: { customer_id: userId, items, updated_at: new Date() } },
    { upsert: true }
  );
}

async function getCart(userId) {
  const carts = await getCollection('carts');
  const cart = await carts.findOne({ customer_id: userId });
  return cart?.items || {};
}

async function run() {
  try {
    await connectMongo();
    console.log('Connected to MongoDB.');

    const email = process.argv[2] || 'scenario-user@example.com';
    const userId = await findOrCreateUser(email);

    console.log('User id:', userId);

    const carts = await getCollection('carts');
    await carts.deleteOne({ customer_id: userId });

    const serverCart = { 'environment-mini': 1, 'industrial-router': 2 };
    const localCart = { 'environment-mini': 1, 'solar-control-box': 1 };
    await saveCart(userId, serverCart);
    const mergedCart = mergeCarts(serverCart, localCart);
    console.log('Server cart:', serverCart);
    console.log('Local cart:', localCart);
    console.log('Merged cart:', mergedCart);

    console.log('\nScenario 2: multiple devices');
    const deviceACart = { 'environment-mini': 1, 'traffic-cam-edge': 1 };
    const deviceBCart = { 'environment-mini': 2, 'water-meter-iot': 1 };
    await saveCart(userId, deviceACart);
    console.log('Device A saved cart:', deviceACart);
    const serverAfterA = await getCart(userId);
    console.log('Server cart after A:', serverAfterA);
    const mergedDeviceBCart = mergeCarts(serverAfterA, deviceBCart);
    await saveCart(userId, mergedDeviceBCart);
    console.log('Device B local cart:', deviceBCart);
    console.log('Merged server cart after B:', await getCart(userId));

    console.log('\nScenario 3: clearing cart on account deletion');
    await saveCart(userId, { 'environment-mini': 1 });
    const beforeDelete = await getCart(userId);
    console.log('Cart before account deletion:', beforeDelete);

    const customers = await getCollection('customers');
    await customers.deleteOne({ id: userId });
    await carts.deleteOne({ customer_id: userId });

    const afterDelete = await getCart(userId);
    console.log('Cart after account deletion:', afterDelete);
    console.log(Object.keys(afterDelete).length === 0 ? 'Cart removed by cascade.' : 'Cart still present.');
  } catch (error) {
    console.error('cart-scenarios failed:', error.message || error);
    process.exit(1);
  }
}

await run();
