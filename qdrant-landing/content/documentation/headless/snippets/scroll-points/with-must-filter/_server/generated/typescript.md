```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

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
