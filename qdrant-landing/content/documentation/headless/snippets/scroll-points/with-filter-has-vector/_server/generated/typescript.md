```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.scroll("{collection_name}", {
  filter: {
    must: [
      {
        has_vector: "image",
      },
    ],
  },
});
```
