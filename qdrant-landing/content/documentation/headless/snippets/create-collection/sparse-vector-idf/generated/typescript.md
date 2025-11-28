```typescript
import { QdrantClient, Schemas } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  sparse_vectors: {
    "text": {
      modifier: "idf"
    }
  }
});
```
