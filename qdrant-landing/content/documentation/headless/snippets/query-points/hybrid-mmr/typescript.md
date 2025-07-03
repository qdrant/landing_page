```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    prefetch: {
        query: [0.01, 0.45, 0.67], // <-- search vector
        limit: 100,
    },
    query: {
        mmr: {
            vector: [0.01, 0.45, 0.67], // <-- same vector
            lambda: 0.5,
        },
    },
});
```
