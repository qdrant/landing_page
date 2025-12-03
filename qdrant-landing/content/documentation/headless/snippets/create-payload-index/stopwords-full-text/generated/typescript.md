```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

// Simple
client.createPayloadIndex("{collection_name}", {
  field_name: "name_of_the_field_to_index",
  field_schema: {
    type: "text",
    tokenizer: "word",
    stopwords: "english"
  },
});

// Explicit
client.createPayloadIndex("{collection_name}", {
  field_name: "name_of_the_field_to_index",
  field_schema: {
    type: "text",
    tokenizer: "word",
    stopwords: {
      languages: [
        "english",
        "spanish"
      ],
      custom: [
        "example"
      ]
    }
  },
});
```
