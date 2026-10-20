```typescript
import { CohereClientV2 } from "cohere-ai";
import { QdrantClient } from "@qdrant/js-client-rest";

const cohere = new CohereClientV2({});
const client = new QdrantClient({ url: "http://localhost:6333" });

await client.createCollection("{collection_name}", {
  vectors: { size: 2048, distance: "Cosine" },
});

const documents = [
  "Qdrant is a vector database and similarity search engine.",
  "Cohere Embed models turn text and images into dense vectors.",
];

const response = await cohere.embed({
  model: "embed-v5.0-pro",
  inputType: "search_document",
  texts: documents,
  embeddingTypes: ["float"],
});

await client.upsert("{collection_name}", {
  points: response.embeddings.float!.map((vector, idx) => ({
    id: idx,
    vector,
    payload: { text: documents[idx] },
  })),
});

const queryResponse = await cohere.embed({
  model: "embed-v5.0-fast",
  inputType: "search_query",
  texts: ["What is Qdrant?"],
  embeddingTypes: ["float"],
});

const queryVector = queryResponse.embeddings.float?.[0];
if (!queryVector) throw new Error("Cohere returned no query embedding");

const { points: hits } = await client.query("{collection_name}", {
  query: queryVector,
  limit: 3,
});

import { readFile } from "node:fs/promises";

const imageUrl = "data:image/png;base64," + (await readFile("diagram.png")).toString("base64");

const imageResponse = await cohere.embed({
  model: "embed-v5.0-pro",
  inputType: "search_document",
  images: [imageUrl],
  embeddingTypes: ["float"],
});

await client.upsert("{collection_name}", {
  points: [{ id: 2, vector: imageResponse.embeddings.float![0], payload: { image: "diagram.png" } }],
});

const reduced = await cohere.embed({
  model: "embed-v5.0-pro",
  inputType: "search_document",
  texts: documents,
  outputDimension: 512,
  embeddingTypes: ["float"],
});
```
