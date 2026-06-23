```typescript
import { QdrantClient, withHeaders } from "@qdrant/js-client-rest";

await withHeaders({ 'openai-api-key': '<YOUR_OPENAI_API_KEY>' }, () =>
    client.upsert("{collection_name}", {
        points: [
            {
                id: 1,
                vector: {
                    text: 'Recipe for baking chocolate chip cookies',
                    model: 'openai/text-embedding-3-large',
                },
            },
        ],
    })
);
```
