```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    prefetch: {
        query: [1, 23, 45, 67], // <------------- small byte vector
        limit: 100,
    },
    query: [
        [0.1, 0.2], // <─┐
        [0.2, 0.1], // < ├─ multi-vector
        [0.8, 0.9], // < ┘
    ],
    using: 'colbert',
    limit: 10,
});
```
