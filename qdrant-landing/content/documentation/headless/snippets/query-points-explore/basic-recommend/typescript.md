```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.query("{collection_name}", {
    query: {
        recommend: {
            positive: [100, 231],
            negative: [718, [0.2, 0.3, 0.4, 0.5]],
            strategy: "average_vector"
        }
    },
    filter: {
        must: [
            {
                key: "city",
                match: {
                    value: "London",
                },
            },
        ],
    },
    limit: 3
});
```
