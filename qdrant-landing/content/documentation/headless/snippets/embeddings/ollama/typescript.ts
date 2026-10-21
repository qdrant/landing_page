// @block-start setup
import ollama from "ollama";
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ url: "http://localhost:6333" });

const MODEL = "qwen3-embedding:0.6b";

await client.createCollection("{collection_name}", {
  vectors: { size: 1024, distance: "Cosine" },
});
// @block-end setup

// @block-start embed-documents
const documents = [
  "Qdrant is a vector search engine.",
  "Ollama runs open models on your own hardware.",
];

const response = await ollama.embed({ model: MODEL, input: documents });

await client.upsert("{collection_name}", {
  points: response.embeddings.map((vector, idx) => ({
    id: idx,
    vector,
    payload: { text: documents[idx] },
  })),
});
// @block-end embed-documents

// @block-start embed-queries
const TASK =
  "Given a web search query, retrieve relevant passages that answer the query";

const queryResponse = await ollama.embed({
  model: MODEL,
  input: `Instruct: ${TASK}\nQuery:What is Qdrant?`,
});

const { points: hits } = await client.query("{collection_name}", {
  query: queryResponse.embeddings[0],
  limit: 3,
});
// @block-end embed-queries

// @block-start reduce-vector-size
const reduced = await ollama.embed({
  model: MODEL,
  input: documents,
  dimensions: 256,
});
// @block-end reduce-vector-size
