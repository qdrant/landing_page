```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.createCollection("{collection_name}", {
  vectors: {
    size: 768,
    distance: "Cosine",
    memory: "cold",
    datatype: "turbo4"
  },
  quantization_config: {
    turbo: {
      bits: "bits1",
      memory: "pinned",
    },
  },
});
```
