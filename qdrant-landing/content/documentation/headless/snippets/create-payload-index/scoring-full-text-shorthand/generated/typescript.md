```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.createPayloadIndex("{collection_name}", {
  field_name: "name_of_the_field_to_index",
  field_schema: {
    type: "text",
    tokenizer: "word",
    lowercase: true,
    scoring: true,
  },
});
```
