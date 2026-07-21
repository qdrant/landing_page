```typescript
await client.upsert(COLLECTION, {
    points: prepareChunksForSync(CHUNKS).map((c) => ({
        id: c.point_id,
        vector: { text: c.text, model: MODEL },
        payload: payload(c),
    })),
    wait: true,
});
```
