```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    prefetch: [
        {
            query: [0.01, 0.45, 0.67], // <-- dense vector
            filter: {
                must: {
                    key: 'color',
                    match: {
                        value: 'red',
                    },
                }
            },
            limit: 10,
        },
        {
            query: [0.01, 0.45, 0.67], // <-- dense vector
            filter: {
                must: {
                    key: 'color',
                    match: {
                        value: 'green',
                    },
                }
            },
            limit: 10,
        },
    ],
    query: {
        order_by: 'price',
    },
});
```
