```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.createCollection("{collection_name}", {
  vectors: {
    size: 768,
    distance: "Cosine",
  },
  quantization_config: {
    product: {
      compression: "x16",
      memory: "pinned",
    },
  },
});
```
