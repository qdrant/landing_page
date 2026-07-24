```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.createPayloadIndex("{collection_name}", {
  field_name: "payload_field_name",
  field_schema: {
    type: "keyword",
    memory: "cold"
  },
});
```
