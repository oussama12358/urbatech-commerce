const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '../backend/backups/mongo-backup-2026-07-12T13-01-55-689Z.json');
try {
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = JSON.parse(raw);
  const collections = parsed.collections || {};
  const products = collections.products || [];
  console.log('Total products in backup:', products.length);
  const withSupplier = products.filter(p => p.supplier_id);
  console.log('Products with supplier_id:', withSupplier.length);
  const sample = withSupplier.slice(0, 10).map(p => ({ id: p.id, supplier_id: p.supplier_id, name: p.name }));
  console.log('Sample with supplier_id (up to 10):', sample);
  const supplierIds = [...new Set(withSupplier.map(p => p.supplier_id))];
  console.log('Distinct supplier_ids count:', supplierIds.length);
  console.log('Distinct sample supplier_ids (up to 10):', supplierIds.slice(0,10));
  const suppliers = collections.suppliers || [];
  console.log('Total suppliers in backup:', suppliers.length);
  const supplierSample = suppliers.slice(0,10).map(s => ({ id: s.id, company_name: s.company_name, status: s.status, api_health: s.api_health }));
  console.log('Supplier sample (up to 10):', supplierSample);
} catch (err) {
  console.error('Error reading/parsing backup:', err.message);
  process.exit(2);
}
