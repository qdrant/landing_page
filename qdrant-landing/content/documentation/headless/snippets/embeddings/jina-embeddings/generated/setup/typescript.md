```typescript
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
```
