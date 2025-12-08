```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.deleteSnapshot("{collection_name}", "{snapshot_name}");
```
