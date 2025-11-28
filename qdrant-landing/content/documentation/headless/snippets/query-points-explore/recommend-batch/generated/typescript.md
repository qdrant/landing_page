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
        query: {
            recommend: {
                positive: [100, 231],
                negative: [718]
            }
        },
        filter,
        limit: 3,
    },
    {
        query: {
            recommend: {
                positive: [200, 67],
                negative: [300]
            }
        },
        filter,
        limit: 3,
    },
];

client.queryBatch("{collection_name}", {
    searches,
});
```
