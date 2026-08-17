```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.createCollection("{collection_name}", {
  vectors: {
    size: 768,
    distance: "Cosine",
    datatype: "turbo4",
  },
  quantization_config: {
    turbo: {
      type: "bits4",
      memory: "pinned",
    },
  },
});
```
