```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.createPayloadIndex("books", {
  field_name: "title",
  field_schema: {
    type: "text",
    stemmer: {
      type: "snowball",
      language: "spanish",
    },
    stopwords: "spanish",
    scoring: true,
  },
});
```
