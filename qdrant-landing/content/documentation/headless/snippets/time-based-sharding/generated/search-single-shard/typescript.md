```typescript
const queryText = "coffee";

const singleShardResult = await client.query(collectionName, {
    query: { text: queryText, model: denseModel },
    using: "dense_vector",
    limit: 5,
    shard_key: "2026-04-07",
});

for (const hit of singleShardResult.points) {
    console.log(hit);
}
```
