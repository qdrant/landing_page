```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

await client.createCollection("books", {
  vectors: {
    "description-dense": { size: 384, distance: "Cosine" },
  },
});

await client.createPayloadIndex("books", {
  field_name: "title",
  field_schema: {
    type: "text",
    scoring: true,
  },
});
```
