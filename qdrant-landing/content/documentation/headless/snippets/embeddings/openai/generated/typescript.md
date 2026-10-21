```typescript
import OpenAI from "openai";
import { QdrantClient } from "@qdrant/js-client-rest";

const openai = new OpenAI();
const client = new QdrantClient({ url: "http://localhost:6333" });

const MODEL = "text-embedding-3-small";

await client.createCollection("{collection_name}", {
  vectors: { size: 1536, distance: "Cosine" },
});

const documents = [
  "Qdrant is a vector search engine.",
  "OpenAI embedding models turn text into dense vectors.",
];

const response = await openai.embeddings.create({ model: MODEL, input: documents });

await client.upsert("{collection_name}", {
  points: response.data.map((item) => ({
    id: item.index,
    vector: item.embedding,
    payload: { text: documents[item.index] },
  })),
});

const queryResponse = await openai.embeddings.create({
  model: MODEL,
  input: "What is Qdrant?",
});

const { points: hits } = await client.query("{collection_name}", {
  query: queryResponse.data[0].embedding,
  limit: 3,
});

const reduced = await openai.embeddings.create({
  model: "text-embedding-3-large",
  input: documents,
  dimensions: 1024,
});
```
