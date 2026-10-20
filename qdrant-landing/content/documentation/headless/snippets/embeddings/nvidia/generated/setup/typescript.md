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
```
