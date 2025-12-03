```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
  "query": [
    [-0.013, 0.020, -0.007, -0.111],
    [-0.030, -0.055, 0.001, 0.072],
    [-0.041, 0.014, -0.032, -0.062]
  ]
});
```
