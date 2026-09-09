```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.createCollection("{collection_name}", {
  vectors: {
    size: 300,
    distance: "Cosine",
  },
  shard_number: 6,
  replication_factor: 2,
});
```
