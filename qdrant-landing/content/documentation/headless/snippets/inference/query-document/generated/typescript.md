```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.query("{collection_name}", {
    query: {
        text: 'My Query Text',
        model: '<the-model-to-use>',
    },
});
```
