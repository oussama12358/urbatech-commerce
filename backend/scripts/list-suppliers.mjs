import { getCollection, connectMongo } from "../src/db/mongo.js";

async function main() {
  try {
    await connectMongo();
    const suppliers = await getCollection("suppliers");

    const total = await suppliers.countDocuments();
    console.log(`Total suppliers: ${total}`);

    const agg = await suppliers.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    console.log("Status counts:");
    agg.forEach((row) => console.log(`  ${row._id || "<none>"}: ${row.count}`));

    console.log("\nSample suppliers:");
    const rows = await suppliers.find({}, { projection: { _id: 0, id: 1, company_name: 1, status: 1, api_health: 1, products_count: 1, api_url: 1 } }).limit(20).toArray();
    rows.forEach((s) => console.log(JSON.stringify(s)));

    process.exit(0);
  } catch (err) {
    console.error("Error:", err && err.message);
    process.exit(2);
  }
}

main();
