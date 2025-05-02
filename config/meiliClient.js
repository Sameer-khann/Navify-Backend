import { MeiliSearch } from "meilisearch";
import dotenv from "dotenv";

dotenv.config();

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST,
  apiKey: process.env.MEILISEARCH_API_KEY,
});

// console.log("MEILISEARCH_HOST =", process.env.MEILISEARCH_HOST)
// console.log("MEILISEARCH_API_KEY =", process.env.MEILISEARCH_API_KEY)

export default client;
