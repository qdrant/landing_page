```typescript
const rerankedResults = await client.query(collectionName, {
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
    query: { text: query, model: lateInteractionEmbeddingModel },
    using: "multi",
    with_payload: true,
    limit: 10,
});

console.log(rerankedResults.points);
```
