```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    query: '43cf51e2-8777-4f52-bc74-c2cbde0c8b04', // <--- point id
});
```
