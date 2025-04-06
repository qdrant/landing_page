```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  vectors: {
    size: 128,
    distance: "Cosine",
    datatype: "uint8"
  },
  sparse_vectors: {
    text: {
      index: {
        datatype: "uint8"
      }
    }
  }
});
```
