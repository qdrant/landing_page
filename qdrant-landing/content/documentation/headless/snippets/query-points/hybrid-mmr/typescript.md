```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
  query: {
    nearest: [0.01, 0.45, 0.67, ...], // search vector
    mmr: {
      lambda: 0.5, // 0.0 - diversity; 1.0 - relevance
      candidate_limit: 100 // num of candidates to preselect
    }
  },
  limit: 10,
});
```
