```typescript
import { QdrantClient, withHeaders } from "@qdrant/js-client-rest";

await withHeaders({ 'openai-api-key': '<YOUR_OPENAI_API_KEY>' }, () =>
    client.upsert("{collection_name}", {
        points: [
            {
                id: 1,
                vector: {
                    large: {
                        text: 'Recipe for baking chocolate chip cookies',
                        model: 'openai/text-embedding-3-small',
                    },
                    small: {
                        text: 'Recipe for baking chocolate chip cookies',
                        model: 'openai/text-embedding-3-small',
                        options: {
                            mrl: 64,
                        },
                    },
                },
            },
        ],
    })
);
```
