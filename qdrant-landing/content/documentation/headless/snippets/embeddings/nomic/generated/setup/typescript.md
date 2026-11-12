```typescript
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
```
