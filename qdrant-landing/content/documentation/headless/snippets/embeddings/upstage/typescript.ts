// @block-start setup
import OpenAI from "openai";
import { QdrantClient } from "@qdrant/js-client-rest";

const upstage = new OpenAI({
  apiKey: process.env.UPSTAGE_API_KEY,
  baseURL: "https://api.upstage.ai/v1",
});
const client = new QdrantClient({ url: "http://localhost:6333" });

await client.createCollection("{collection_name}", {
  vectors: { size: 1024, distance: "Cosine" },
});
// @block-end setup

// @block-start embed-documents
const documents = [
  "Qdrant is a vector search engine.",
  "Upstage Solar Embedding models turn text into dense vectors.",
];

const response = await upstage.embeddings.create({
  model: "solar-embedding-2-passage",
  input: documents,
});

await client.upsert("{collection_name}", {
  points: response.data.map((item) => ({
    id: item.index,
    vector: item.embedding,
    payload: { text: documents[item.index] },
  })),
});
// @block-end embed-documents

// @block-start embed-queries
const queryResponse = await upstage.embeddings.create({
  model: "solar-embedding-2-query",
  input: "What is Qdrant?",
});

const { points: hits } = await client.query("{collection_name}", {
  query: queryResponse.data[0].embedding,
  limit: 3,
});
// @block-end embed-queries
