```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    prefetch: [
      // 2+ prefetches here
    ],
    query: { rrf: { k: 60 } },
});
```
