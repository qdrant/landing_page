```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  strict_mode_config: {
    enabled: true,
    max_payload_index_count: 10,
  },
});
```
