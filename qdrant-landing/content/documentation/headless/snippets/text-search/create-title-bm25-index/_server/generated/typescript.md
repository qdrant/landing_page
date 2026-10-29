```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.createPayloadIndex("books", {
  field_name: "title",
  field_schema: {
    type: "text",
    scoring: true,
  },
});
```
