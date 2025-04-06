```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.upsert("{collection_name}", {
  points: [
    {
      id: 1,
      payload: { group_id: "user_1" },
      vector: [0.9, 0.1, 0.1],
    },
    {
      id: 2,
      payload: { group_id: "user_1" },
      vector: [0.1, 0.9, 0.1],
    },
    {
      id: 3,
      payload: { group_id: "user_2" },
      vector: [0.1, 0.1, 0.9],
    },
  ],
});
```
