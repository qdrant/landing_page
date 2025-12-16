```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    query: '43cf51e2-8777-4f52-bc74-c2cbde0c8b04', // <--- point id
    using: '512d-vector',
    lookup_from: {
        collection: 'another_collection', // <--- other collection name
        vector: 'image-512', // <--- vector name in the other collection
    }
});
```
