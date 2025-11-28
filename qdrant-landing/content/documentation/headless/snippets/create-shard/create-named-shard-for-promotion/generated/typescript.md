```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createShardKey("{collection_name}", {
    shard_key: "default",
    initial_state: "Partial"
});
```
