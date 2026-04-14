```typescript
const hybridResults = await client.query(collectionName, {
    prefetch: [
        {
            query: { text: query, model: denseEmbeddingModel },
            using: "dense",
            limit: 20,
        },
        {
            query: { text: query, model: sparseEmbeddingModel },
            using: "sparse",
            limit: 20,
        },
    ],
    query: { fusion: "rrf" },
    with_payload: true,
    limit: 10,
});

console.log(hybridResults.points);
```
