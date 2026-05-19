```typescript
import { QdrantClient, withHeaders } from "@qdrant/js-client-rest";

const result = await withHeaders({ "x-request-id": "my-trace-id" }, () =>
    client.getCollections()
);
```
