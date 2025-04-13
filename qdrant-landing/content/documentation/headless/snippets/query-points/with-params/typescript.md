```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    query: [0.2, 0.1, 0.9, 0.7],
    params: {
        hnsw_ef: 128,
        exact: false,
    },
    limit: 3,
});
```
