```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
  prefetch: {
    query: [1, 23, 45, 67], // <------------- small byte vector
    using: 'mrl_byte',
    limit: 1000,
  },
  query: [0.01, 0.299, 0.45, 0.67], // <-- full vector,
  using: 'full',
  limit: 10,
});
```
