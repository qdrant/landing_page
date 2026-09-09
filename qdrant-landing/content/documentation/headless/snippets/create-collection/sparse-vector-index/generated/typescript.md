```typescript
import { QdrantClient, Schemas } from "@qdrant/js-client-rest";

client.createCollection("{collection_name}", {
  sparse_vectors: {
    "text": {
      index: {}
    }
  }
});
```
