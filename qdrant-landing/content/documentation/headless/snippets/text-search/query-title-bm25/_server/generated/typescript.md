```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.query("books", {
  query: {
    text: "time travel",
  },
  using: "title",
  limit: 10,
  with_payload: true,
});
```
