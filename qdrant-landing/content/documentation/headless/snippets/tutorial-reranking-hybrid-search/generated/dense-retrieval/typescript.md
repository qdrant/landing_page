```typescript
const query = "time travel";

const denseResults = await client.query(collectionName, {
    query: { text: query, model: denseEmbeddingModel },
    using: "dense",
    limit: 10,
});

console.log(denseResults.points);
```
