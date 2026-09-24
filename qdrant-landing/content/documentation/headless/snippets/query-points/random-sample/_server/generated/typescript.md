```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const sampled = await client.query("{collection_name}", {
  query: {
    sample: "random",
  },
});
```
