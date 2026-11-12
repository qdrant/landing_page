```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

await client.createCollection("{collection_name}", {
  vectors: {
    dense_vector: { size: 384, distance: "Cosine" },
  },
});

await client.createPayloadIndex("{collection_name}", {
  field_name: "passage_text",
  field_schema: {
    type: "text",
    scoring: true, // Enable BM25 scoring
  },
});
```
