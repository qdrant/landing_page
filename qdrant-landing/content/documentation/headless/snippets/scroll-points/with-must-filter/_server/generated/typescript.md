```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.scroll("{collection_name}", {
  filter: {
    must: [
      {
        key: "city",
        match: { value: "London" },
      },
      {
        key: "color",
        match: { value: "red" },
      },
    ],
  },
});
```
