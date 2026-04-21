```typescript
const multiShardResult = await client.query(collectionName, {
    query: { text: queryText, model: denseModel },
    using: "dense_vector",
    limit: 5,
    shard_key: ["2026-04-06", "2026-04-07"],
});

for (const hit of multiShardResult.points) {
    console.log(hit);
}
```
