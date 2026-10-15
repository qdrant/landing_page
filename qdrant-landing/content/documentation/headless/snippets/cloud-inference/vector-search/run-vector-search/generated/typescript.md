```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const results = await client.query("{collection_name}", {
    prefetch: [
        {
            query: {
                text: queryText,
                model: denseModel,
            },
            using: "dense_vector",
        },
        {
            query: {
                text: queryText,
            },
            using: "passage_text",
        },
    ],
    query: {
        fusion: "rrf",
    },
    limit: 5,
});
```
