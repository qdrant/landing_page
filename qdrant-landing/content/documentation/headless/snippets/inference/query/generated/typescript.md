```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.query("{collection_name}", {
    query: {
        text: 'How to bake cookies?',
        model: 'qdrant/bm25',
    },
    using: 'my-bm25-vector',
});
```
