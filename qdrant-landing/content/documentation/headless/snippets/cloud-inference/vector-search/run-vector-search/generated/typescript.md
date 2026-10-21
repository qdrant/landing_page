```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const results = await client.query("{collection_name}", {
    prefetch: [
        {
            query: {
                text: queryText,
                model: denseModel,
            },
            using: "dense_vector",
            limit: 5,
        },
        {
            query: {
                text: queryText,
            },
            using: "passage_text",
            limit: 5,
        },
    ],
    query: {
        fusion: "rrf",
    },
    limit: 5,
    with_payload: true,
});

for (const point of results.points) {
    console.log(`${point.score.toFixed(3)}  ${String(point.payload?.question).trim()}`);
}
```
