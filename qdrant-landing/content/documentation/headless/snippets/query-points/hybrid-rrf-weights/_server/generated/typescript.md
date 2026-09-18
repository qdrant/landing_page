```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    prefetch: [
        // Prefetches here
    ],
    query: {
        rrf: {
            weights: [3.0, 1.0],
        },
    },
    limit: 10,
});
```
