```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

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
