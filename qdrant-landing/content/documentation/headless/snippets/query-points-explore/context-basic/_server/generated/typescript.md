```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.query("{collection_name}", {
    query: {
        context: [
            {
                positive: 100,
                negative: 718,
            },
            {
                positive: 200,
                negative: 300,
            },
        ]
    },
    limit: 10,
});
```
