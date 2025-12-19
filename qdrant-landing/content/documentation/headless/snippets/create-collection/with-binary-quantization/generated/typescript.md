```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  vectors: {
    size: 1536,
    distance: "Cosine",
  },
  quantization_config: {
    binary: {
      always_ram: true,
    },
  },
});
```
