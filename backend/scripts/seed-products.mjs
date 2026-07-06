import 'dotenv/config';
import { getCollection, connectMongo, createId } from '../src/db/mongo.js';

const products = [
  {
    id: 'environment-mini',
    name: 'Environment Mini',
    category: 'Sensors',
    desc: 'Compact environmental sensor for air quality, temperature, and humidity monitoring.',
    price: 249.99,
    margin: 25,
    stock: 18,
    status: 'In stock',
    warranty: '2 years',
    lead: '3-5 days',
    specs: ['Air quality', 'Humidity', 'Temperature']
  },
  {
    id: 'industrial-router',
    name: 'Industrial Router',
    category: 'Networking',
    desc: 'Rugged 4G LTE router for remote infrastructure connectivity.',
    price: 1299.0,
    margin: 32,
    stock: 12,
    status: 'In stock',
    warranty: '3 years',
    lead: '7-10 days',
    specs: ['4G LTE', 'VPN', 'PoE']
  },
  {
    id: 'solar-control-box',
    name: 'Solar Control Box',
    category: 'Power',
    desc: 'Weatherproof controller for solar PV and battery storage systems.',
    price: 899.0,
    margin: 28,
    stock: 6,
    status: 'Low stock',
    warranty: '5 years',
    lead: '5-7 days',
    specs: ['MPPT', 'Battery support', 'Remote monitoring']
  },
  {
    id: 'traffic-cam-edge',
    name: 'Traffic Cam Edge',
    category: 'Surveillance',
    desc: 'Edge AI camera for smart traffic management and analytics.',
    price: 1799.0,
    margin: 35,
    stock: 4,
    status: 'In stock',
    warranty: '2 years',
    lead: '10-14 days',
    specs: ['AI detection', 'Night vision', 'Edge compute']
  },
  {
    id: 'water-meter-iot',
    name: 'Water Meter IoT',
    category: 'Metering',
    desc: 'Smart water meter with remote telemetry and leak alerts.',
    price: 479.0,
    margin: 22,
    stock: 16,
    status: 'In stock',
    warranty: '3 years',
    lead: '7-10 days',
    specs: ['Telemetry', 'Leak detection', 'Cloud integration']
  }
];

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function ensureCategoryId(name) {
  if (!name) return null;

  const categories = await getCollection('categories');
  const existing = await categories.findOne({ name });
  if (existing) return existing.id;

  const baseSlug = slugify(name) || 'category';
  let slug = baseSlug;
  let suffix = 1;
  while (await categories.findOne({ slug })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const category = {
    id: createId(),
    name,
    slug,
    created_at: new Date()
  };
  await categories.insertOne(category);
  return category.id;
}

try {
  await connectMongo();
  console.log('Connected to MongoDB.');

  for (const product of products) {
    const productsCollection = await getCollection('products');
    const existing = await productsCollection.findOne({ id: product.id });
    if (existing) {
      console.log('Skipping existing product', product.id);
      continue;
    }

    const categoryId = await ensureCategoryId(product.category);
    await productsCollection.insertOne({
      id: product.id,
      category_id: categoryId,
      name: product.name,
      description: product.desc,
      price: product.price,
      margin: product.margin,
      stock: product.stock,
      status: product.status,
      warranty: product.warranty,
      lead_time: product.lead,
      specs: product.specs,
      images: [],
      active: true,
      created_at: new Date()
    });

    console.log('Inserted', product.id);
  }

  console.log('Seeding completed.');
} catch (err) {
  console.error('Seeding failed:', err.message || err);
  process.exit(1);
}
