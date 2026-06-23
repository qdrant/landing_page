```typescript
import { QdrantClient, withHeaders } from "@qdrant/js-client-rest";

await withHeaders({ 'openai-api-key': '<YOUR_OPENAI_API_KEY>' }, () =>
    client.query("{collection_name}", {
        query: {
            text: 'How to bake cookies?',
            model: 'openai/text-embedding-3-large',
            options: {
                dimensions: 512,
            },
        },
    })
);
```
