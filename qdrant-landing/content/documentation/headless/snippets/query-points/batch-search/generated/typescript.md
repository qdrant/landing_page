```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

const filter = {
    must: [
        {
            key: "city",
            match: {
                value: "London",
            },
        },
    ],
};

const searches = [
    {
        query: [0.2, 0.1, 0.9, 0.7],
        filter,
        limit: 3,
    },
    {
        query: [0.5, 0.3, 0.2, 0.3],
        filter,
        limit: 3,
    },
];

client.queryBatch("{collection_name}", {
    searches,
});
```
