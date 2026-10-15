```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

const geodesic = await client.query("{collection_name}", {
  prefetch: {
    query: [-3.2, 0.3, 0.4], // the time coordinate (the first value) is negated
    limit: 100
  },
  query: {
    formula: {
      mult: [
        -3.1622776601683795, // -1 / sqrt(0.1)
        { acosh: { mult: [0.1, { neg: "$score" }] } }
      ]
    }
  }
});
```
