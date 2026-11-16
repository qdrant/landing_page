// @block-start setup
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ url: "http://localhost:6333" });

const MODEL = "nomic-embed-text-v1.5";

async function embed(texts: string[], taskType: string, dimensionality?: number) {
  const response = await fetch("https://api-atlas.nomic.ai/v1/embedding/text", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NOMIC_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, texts, task_type: taskType, dimensionality }),
  });
  if (!response.ok) {
    throw new Error(`Nomic API error ${response.status}: ${await response.text()}`);
  }
  const { embeddings } = (await response.json()) as { embeddings: number[][] };
  return embeddings;
}

await client.createCollection("{collection_name}", {
  vectors: { size: 768, distance: "Cosine" },
});
// @block-end setup

// @block-start embed-documents
const documents = [
  "Qdrant is a vector search engine.",
  "Nomic Embed models turn text into dense vectors.",
  "Paris is the capital of France.",
];

const embeddings = await embed(documents, "search_document");

await client.upsert("{collection_name}", {
  points: embeddings.map((vector, idx) => ({
    id: idx,
    vector,
    payload: { text: documents[idx] },
  })),
});
// @block-end embed-documents

// @block-start embed-queries
const [queryVector] = await embed(["What is Qdrant?"], "search_query");

const { points: hits } = await client.query("{collection_name}", {
  query: queryVector,
  limit: 3,
});
// @block-end embed-queries

// @block-start reduce-vector-size
const reduced = await embed(documents, "search_document", 256);
// @block-end reduce-vector-size
