// @block-start setup
import { QdrantClient } from "@qdrant/js-client-rest";

const JINA_URL = "https://api.jina.ai/v1/embeddings";
const MODEL = "jina-embeddings-v5-text-small";

async function jinaEmbed<T = { index: number; embedding: number[] }>(body: object): Promise<T[]> {
  const response = await fetch(JINA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.JINA_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await response.text());
  return ((await response.json()) as { data: T[] }).data;
}

const client = new QdrantClient({ url: "http://localhost:6333" });

await client.createCollection("{collection_name}", {
  vectors: { size: 1024, distance: "Cosine" },
});
// @block-end setup

// @block-start embed-documents
const documents = [
  "Qdrant is a vector search engine.",
  "Jina AI embedding models turn text, images, and video into dense vectors.",
];

const data = await jinaEmbed({ model: MODEL, task: "retrieval.passage", input: documents });

await client.upsert("{collection_name}", {
  points: data.map((item) => ({
    id: item.index,
    vector: item.embedding,
    payload: { text: documents[item.index] },
  })),
});
// @block-end embed-documents

// @block-start embed-queries
const [queryItem] = await jinaEmbed({ model: MODEL, task: "retrieval.query", input: ["What is Qdrant?"] });

const { points: hits } = await client.query("{collection_name}", {
  query: queryItem.embedding,
  limit: 3,
});
// @block-end embed-queries

// @block-start reduce-vector-size
const reduced = await jinaEmbed({
  model: MODEL,
  task: "retrieval.passage",
  input: documents,
  dimensions: 256,
});
// @block-end reduce-vector-size

// @block-start embed-images-video-audio-and-pdfs
const images = ["https://i.ibb.co/nQNGqL0/beach1.jpg", "https://i.ibb.co/r5w8hG8/beach2.jpg"];

const imageData = await jinaEmbed({
  model: "jina-embeddings-v5-omni-small",
  task: "retrieval.passage",
  input: images.map((url) => ({ image: url })),
});

await client.upsert("{collection_name}", {
  points: imageData.map((item) => ({
    id: 100 + item.index,
    vector: item.embedding,
    payload: { image: images[item.index] },
  })),
});
// @block-end embed-images-video-audio-and-pdfs

// @block-start multivector-output
type MultiItem = { index: number; embeddings: number[][] };

await client.createCollection("{colbert_collection_name}", {
  vectors: { size: 128, distance: "Cosine", multivector_config: { comparator: "max_sim" } },
});

const colbertData = await jinaEmbed<MultiItem>({
  model: "jina-colbert-v2",
  input_type: "document",
  input: documents,
});

await client.upsert("{colbert_collection_name}", {
  points: colbertData.map((item) => ({
    id: item.index,
    vector: item.embeddings,
    payload: { text: documents[item.index] },
  })),
});

const [colbertQuery] = await jinaEmbed<MultiItem>({
  model: "jina-colbert-v2",
  input_type: "query",
  input: ["What is Qdrant?"],
});

const { points: colbertHits } = await client.query("{colbert_collection_name}", {
  query: colbertQuery.embeddings,
  limit: 3,
});
// @block-end multivector-output
