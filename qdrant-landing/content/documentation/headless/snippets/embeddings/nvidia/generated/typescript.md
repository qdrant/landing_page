```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/embeddings";
const MODEL = "nvidia/nemotron-3-embed-1b";

type EmbeddingResponse = { data: { index: number; embedding: number[] }[] };

async function nvidiaEmbed(body: object): Promise<EmbeddingResponse> {
  const response = await fetch(NVIDIA_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`NVIDIA API error ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

const client = new QdrantClient({ url: "http://localhost:6333" });

await client.createCollection("{collection_name}", {
  vectors: { size: 2048, distance: "Cosine" },
});

const documents = [
  "Qdrant is a vector database and similarity search engine.",
  "NVIDIA Nemotron embedding models turn text into dense vectors.",
];

const response = await nvidiaEmbed({
  model: MODEL,
  input: documents,
  input_type: "passage",
  truncate: "END",
});

await client.upsert("{collection_name}", {
  points: response.data.map((item) => ({
    id: item.index,
    vector: item.embedding,
    payload: { text: documents[item.index] },
  })),
});

const queryResponse = await nvidiaEmbed({
  model: MODEL,
  input: ["What is Qdrant?"],
  input_type: "query",
  truncate: "END",
});

const { points: hits } = await client.query("{collection_name}", {
  query: queryResponse.data[0].embedding,
  limit: 3,
});

import { readFile } from "node:fs/promises";

const VL_MODEL = "nvidia/llama-nemotron-embed-vl-1b-v2";

await client.createCollection("{image_collection_name}", {
  vectors: { size: 2048, distance: "Cosine" },
});

const imageUrl = "data:image/png;base64," + (await readFile("chart.png")).toString("base64");

const imageResponse = await nvidiaEmbed({
  model: VL_MODEL,
  input: [imageUrl],
  modality: ["image"],
  input_type: "passage",
});

await client.upsert("{image_collection_name}", {
  points: [{ id: 1, vector: imageResponse.data[0].embedding, payload: { file: "chart.png" } }],
});

const textResponse = await nvidiaEmbed({
  model: VL_MODEL,
  input: ["Which region had the highest revenue?"],
  modality: ["text"],
  input_type: "query",
});

const { points: imageHits } = await client.query("{image_collection_name}", {
  query: textResponse.data[0].embedding,
  limit: 3,
});
```
