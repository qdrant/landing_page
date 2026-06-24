```typescript
import { QdrantClient, withHeaders } from "@qdrant/js-client-rest";

await withHeaders({ 'cohere-api-key': '<YOUR_COHERE_API_KEY>' }, () =>
    client.query("{collection_name}", {
        query: {
            text: 'a green square',
            model: 'cohere/embed-v4.0',
            options: {
                output_dimension: 512,
            },
        },
    })
);
```
