```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.recoverSnapshot("{collection_name}", {
  location: "http://qdrant-node-1:6333/collections/{collection_name}/snapshots/snapshot-2022-10-10.shapshot",
  priority: "snapshot"
});
```
