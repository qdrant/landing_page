```typescript
import { QdrantClient, withHeaders } from "@qdrant/js-client-rest";

await withHeaders({ 'jina-api-key': '<YOUR_JINAAI_API_KEY>' }, () =>
    client.query("{collection_name}", {
        query: {
            text: 'Mission to Mars',
            model: 'jinaai/jina-clip-v2',
            options: {
                dimensions: 512,
            },
        },
    })
);
```
