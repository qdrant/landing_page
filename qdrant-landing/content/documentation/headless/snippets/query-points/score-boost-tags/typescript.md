```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

const tag_boosted = await client.query(collectionName, {
  prefetch: {
    query: [0.2, 0.8, 0.1, 0.9],
    limit: 50
  },
  query: {
    formula: {
      sum: [
        "$score",
        {
          mult: [ 0.5, { key: "tag", match: { any: ["h1", "h2", "h3", "h4"] }} ]
        },
        {
          mult: [ 0.25, { key: "tag", match: { any: ["p", "li"] }} ]
        }
      ]
    }
  }
});
```

