```typescript
const sparseResults = await client.query(collectionName, {
    query: { text: query, model: sparseEmbeddingModel },
    using: "sparse",
    limit: 10,
});

console.log(sparseResults.points);
```
