```typescript
import { QdrantClient, withHeaders } from "@qdrant/js-client-rest";

await withHeaders({ 'jina-api-key': '<YOUR_JINAAI_API_KEY>' }, () =>
    client.upsert("{collection_name}", {
        points: [
            {
                id: 1,
                vector: {
                    image: 'https://qdrant.tech/example.png',
                    model: 'jinaai/jina-clip-v2',
                    options: {
                        dimensions: 512,
                    },
                },
            },
        ],
    })
);
```
