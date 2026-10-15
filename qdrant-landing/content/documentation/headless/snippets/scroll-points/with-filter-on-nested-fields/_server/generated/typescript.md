```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.scroll("{collection_name}", {
  filter: {
    should: [
      {
        key: "country.name",
        match: { value: "Germany" },
      },
    ],
  },
});
```
