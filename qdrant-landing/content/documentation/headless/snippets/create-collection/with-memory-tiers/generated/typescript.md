```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.createCollection("{collection_name}", {
  vectors: {
    size: 768,
    distance: "Cosine",
    memory: "cached",
  },
  hnsw_config: {
    memory: "cold",
  },
  quantization_config: {
    scalar: {
      type: "int8",
      memory: "pinned",
    },
  },
  payload: {
    memory: "cached",
  },
});
```
