```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.query("{collection_name}", {
    prefetch: [
        {
            query: { text: "time travel" },
            using: 'title',
            limit: 20,
        },
        {
            query: [0.01, 0.45, 0.67],
            using: 'dense',
            limit: 20,
        },
    ],
    query: {
        fusion: 'dbsf',
    },
});
```
