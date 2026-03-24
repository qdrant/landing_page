```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.query("{collection_name}", {
    query: {
        text: 'a green square',
        model: 'cohere/embed-v4.0',
        options: {
            'cohere-api-key': '<your_cohere_api_key>',
            output_dimension: 512,
        },
    },
});
```
