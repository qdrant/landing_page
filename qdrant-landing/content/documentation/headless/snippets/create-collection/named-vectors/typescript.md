```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
    vectors: {
        image: { size: 4, distance: "Dot" },
        text: { size: 5, distance: "Cosine" },
    },
    sparse_vectors: {
        text_sparse: {}
    }
});
```
