```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.createPayloadIndex("{collection_name}", {
  field_name: "name_of_the_field_to_index",
  field_schema: {
    type: "text",
    tokenizer: "word",
    min_token_len: 2,
    max_token_len: 10,
    lowercase: true,
    scoring: true,
  },
});
```
