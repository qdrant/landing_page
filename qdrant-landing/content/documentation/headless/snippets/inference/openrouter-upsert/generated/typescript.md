```typescript
import { QdrantClient, withHeaders } from "@qdrant/js-client-rest";

await withHeaders({ 'openrouter-api-key': '<YOUR_OPENROUTER_API_KEY>' }, () =>
    client.upsert("{collection_name}", {
        points: [
            {
                id: 1,
                vector: {
                    text: 'Recipe for baking chocolate chip cookies',
                    model: 'openrouter/mistralai/mistral-embed-2312',
                },
            },
        ],
    })
);
```
