```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.upsert("{collection_name}", {
    points: [
        {
            id: 1,
            vector: {
                image: 'https://qdrant.tech/example.png',
                model: 'jinaai/jina-clip-v2',
                options: {
                    'jina-api-key': '<your_jinaai_api_key>',
                    dimensions: 512,
                },
            },
        },
    ],
});
```
