```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.scroll("{collection_name}", {
  filter: {
    must: [
      {
        slice: {
          index: 3,
          total: 8,
        },
      },
    ],
  },
});
```
