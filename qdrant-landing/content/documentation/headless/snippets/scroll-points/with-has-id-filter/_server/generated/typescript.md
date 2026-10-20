```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.scroll("{collection_name}", {
  filter: {
    must: [
      {
        has_id: [1, 3, 5, 7, 9, 11],
      },
    ],
  },
});
```
