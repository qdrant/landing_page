```typescript
import { multivectorEmbedding } from "@superlinked/sie-sdk";

await client.createCollection("{colbert_collection_name}", {
  vectors: {
    colbert: {
      size: 128,
      distance: "Cosine",
      multivector_config: { comparator: "max_sim" },
    },
  },
});

const colbertResults = await sie.encode(
  "jinaai/jina-colbert-v2",
  documents.map((text) => ({ text })),
  { outputTypes: ["multivector"] },
);

await client.upsert("{colbert_collection_name}", {
  points: colbertResults.map((result, idx) => {
    if (!result.multivector) throw new Error("SIE returned no multivector");
    return {
      id: idx,
      vector: { colbert: multivectorEmbedding(result.multivector) },
      payload: { text: documents[idx] },
    };
  }),
});

const colbertQuery = await sie.encode(
  "jinaai/jina-colbert-v2",
  { text: "What is Qdrant?" },
  { outputTypes: ["multivector"], isQuery: true },
);

if (!colbertQuery.multivector) throw new Error("SIE returned no query multivector");

const { points: colbertHits } = await client.query("{colbert_collection_name}", {
  query: multivectorEmbedding(colbertQuery.multivector),
  using: "colbert",
  limit: 3,
});
```
