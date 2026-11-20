```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    prefetch: {
        query: [0.01, 0.45, 0.67], // <-- dense vector
        filter: {
            must: [
                {
                    key: "price",
                    range: { gte: 10, lte: 80 },
                },
            ],
        },
        limit: 100, // <-- candidates that compete for the top spots
    },
    query: {
        order_by: {
            key: "price",
            direction: "asc",
        },
    },
    limit: 10,
    with_payload: true,
});
```
