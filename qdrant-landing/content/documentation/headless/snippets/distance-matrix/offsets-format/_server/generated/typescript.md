```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

client.searchMatrixOffsets("{collection_name}", {
    filter: {
        must: [
            {
                key: "color",
                match: {
                    value: "red",
                },
            },
        ],
    },
    sample: 10,
    limit: 2,
});
```
