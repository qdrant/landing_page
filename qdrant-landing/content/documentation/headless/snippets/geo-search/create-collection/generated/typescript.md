```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

await client.createCollection("venues", {
    vectors: { size: 384, distance: "Cosine" },
});
```
