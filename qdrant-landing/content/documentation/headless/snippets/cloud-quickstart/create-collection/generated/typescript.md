```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

await client.createCollection("items", {
    vectors: { size: 384, distance: "Cosine" },
});
```
