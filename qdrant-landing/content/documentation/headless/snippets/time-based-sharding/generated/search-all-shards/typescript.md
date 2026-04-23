```typescript
const allShardsResult = await client.query(collectionName, {
    query: { text: queryText, model: denseModel },
    using: "dense_vector",
    limit: 5,
});

for (const hit of allShardsResult.points) {
    console.log(hit);
}
```
