```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  vectors: {
    size: 768,
    distance: "Cosine",
  },
  quantization_config: {
    product: {
      compression: "x16",
      always_ram: true,
    },
  },
});
```
