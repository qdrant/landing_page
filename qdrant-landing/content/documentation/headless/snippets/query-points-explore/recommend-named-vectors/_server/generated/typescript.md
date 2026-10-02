```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.query("{collection_name}", {
    query: {
        recommend: {
            positive: [100, 231],
            negative: [718],
        }
    },
    using: "image",
    limit: 10
});
```
