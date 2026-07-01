```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.upsert("{collection_name}", {
    points: [
        {
            id: 1,
            vector: {
                'my-bm25-vector': {
                    text: 'Recipe for baking chocolate chip cookies',
                    model: 'Qdrant/bm25',
                },
            },
        },
    ],
});
```
