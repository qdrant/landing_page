```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.query("{collection_name}", {
    query: {
        text: 'How to bake cookies?',
        model: 'openrouter/mistralai/mistral-embed-2312',
        options: {
            'openrouter-api-key': '<your_openrouter_api_key>'
        },
    },
});
```
