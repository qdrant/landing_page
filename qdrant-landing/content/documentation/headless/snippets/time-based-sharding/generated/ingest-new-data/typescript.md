```typescript
await client.upsert(collectionName, {
    points: [
        {
            id: crypto.randomUUID(),
            vector: {
                dense_vector: {
                    text: "The best way to start a Wednesday is with a cup of coffee",
                    model: denseModel,
                },
            },
            payload: {
                text: "The best way to start a Wednesday is with a cup of coffee",
                datetime: "2026-04-08T07:57:47",
            },
        },
    ],
    shard_key: today,
});
```
