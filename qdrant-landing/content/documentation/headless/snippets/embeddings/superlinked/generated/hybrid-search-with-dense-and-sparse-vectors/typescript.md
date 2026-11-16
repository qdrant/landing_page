```typescript
import { sparseEmbedding } from "@superlinked/sie-sdk";

await client.createCollection("{hybrid_collection_name}", {
  vectors: { dense: { size: 1024, distance: "Cosine" } },
  sparse_vectors: { sparse: {} },
});

const hybridResults = await sie.encode(
  "BAAI/bge-m3",
  documents.map((text) => ({ text })),
  { outputTypes: ["dense", "sparse"] },
);

await client.upsert("{hybrid_collection_name}", {
  points: hybridResults.map((result, idx) => ({
    id: idx,
    vector: {
      dense: denseEmbedding(result),
      sparse: sparseEmbedding(result),
    },
    payload: { text: documents[idx] },
  })),
});
```
