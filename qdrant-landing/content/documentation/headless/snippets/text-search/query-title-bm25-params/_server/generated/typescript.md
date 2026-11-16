```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.query("books", {
  query: {
    text: {
      query: "time travel",
      scoring: {
        bm25: {
          k: 1.5,
          b: 0.5,
        },
      },
    },
  },
  using: "title",
  limit: 10,
  with_payload: true,
});
```
