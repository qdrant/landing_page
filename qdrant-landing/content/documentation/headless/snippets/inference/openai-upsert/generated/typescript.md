```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.upsert("{collection_name}", {
    points: [
        {
            id: 1,
            vector: {
                text: 'Recipe for baking chocolate chip cookies',
                model: 'openai/text-embedding-3-large',
                options: {
                    'openai-api-key': '<your_openai_api_key>',
                    dimensions: 512,
                },
            },
        },
    ],
});
```
