import 'dotenv/config';
import { getCollection, connectMongo } from '../src/db/mongo.js';

const [, , email, role] = process.argv;
const allowedRoles = new Set(['admin', 'Client']);

if (!email || !role) {
  console.error('Usage: npm run set-role -- user@email.com admin');
  console.error('Roles: admin, Client');
  process.exit(1);
}

if (!allowedRoles.has(role)) {
  console.error(`Invalid role "${role}". Use "admin" or "Client".`);
  process.exit(1);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

try {
  const client = await connectMongo();
  const customers = await getCollection('customers');
  const updated = await customers.findOneAndUpdate(
    { email: { $regex: `^${escapeRegExp(email)}$`, $options: 'i' } },
    { $set: { role } },
    { returnDocument: 'after' }
  );

  const result = updated?.value ?? updated;
  if (!result) {
    console.error(`No user found with email ${email}`);
    await client.close();
    process.exit(1);
  }

  console.log(`Role updated: ${result.email} -> ${result.role}`);
  await client.close();
} catch (err) {
  console.error('Failed to update role:', err.message || err);
  process.exit(1);
}
