import { connectMongo, getCollection } from "./mongo.js";

export async function query(collectionName, filter = {}, options = {}) {
  await connectMongo();
  const collection = await getCollection(collectionName);
  return collection.find(filter, options).toArray();
}
