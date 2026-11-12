```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.query("{collection_name}", {
    prefetch: {
        query: [0.01, 0.45, 0.67], // <-- dense vector
        using: "dense",
        limit: 100,
    },
    query: { text: "time travel" },
    using: "title",
    limit: 10,
});
```
