```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    query: {
        indices: [1, 3, 5, 7],
        values: [0.1, 0.2, 0.3, 0.4]
    },
    using: "text",
    limit: 3,
});
```
