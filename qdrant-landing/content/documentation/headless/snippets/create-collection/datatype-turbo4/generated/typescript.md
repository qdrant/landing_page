```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.createCollection("{collection_name}", {
  vectors: { size: 1024, distance: "Cosine", datatype: "turbo4" },
});
```
