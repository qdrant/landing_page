```typescript
const results = await client.query(collectionName, {
    prefetch: [
        {
            query: {
                text: queryText,
                model: denseModel,
            },
            using: "dense_vector",
        },
        {
            query: {
                text: queryText,
                model: bm25Model,
            },
            using: "bm25_sparse_vector",
        },
    ],
    query: {
        fusion: "rrf",
    },
});
```
