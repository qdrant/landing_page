```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.createCollection("{collection_name}", {
  vectors: {
    size: 768,
    distance: "Cosine",
  },
  quantization_config: {
    scalar: {
      type: "int8",
      quantile: 0.99,
      memory: "pinned",
    },
  },
});
```
