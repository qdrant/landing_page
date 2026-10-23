```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.query("{collection_name}", {
    query: [0.2, 0.1, 0.9, 0.7], // <--- Dense vector
});
```
