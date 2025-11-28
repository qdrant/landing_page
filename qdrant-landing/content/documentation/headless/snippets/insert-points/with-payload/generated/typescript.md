```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.upsert("{collection_name}", {
  points: [
    {
      id: 1,
      vector: [0.05, 0.61, 0.76, 0.74],
      payload: {
        city: "Berlin",
        price: 1.99,
      },
    },
    {
      id: 2,
      vector: [0.19, 0.81, 0.75, 0.11],
      payload: {
        city: ["Berlin", "London"],
        price: 1.99,
      },
    },
    {
      id: 3,
      vector: [0.36, 0.55, 0.47, 0.94],
      payload: {
        city: ["Berlin", "Moscow"],
        price: [1.99, 2.99],
      },
    },
  ],
});
```
