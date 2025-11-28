```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    prefetch: [
        {
            query: {
                values: [0.22, 0.8],
                indices: [1, 42],
            },
            using: 'sparse',
            limit: 20,
        },
        {
            query: [0.01, 0.45, 0.67],
            using: 'dense',
            limit: 20,
        },
    ],
    query: {
        fusion: 'rrf',
    },
});
```
