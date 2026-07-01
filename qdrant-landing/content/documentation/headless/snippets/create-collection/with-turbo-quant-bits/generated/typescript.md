```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.createCollection("{collection_name}", {
  vectors: {
    size: 1536,
    distance: "Cosine",
  },
  quantization_config: {
    turbo: {
      always_ram: true,
      bits: "bits2",
    },
  },
});
```
