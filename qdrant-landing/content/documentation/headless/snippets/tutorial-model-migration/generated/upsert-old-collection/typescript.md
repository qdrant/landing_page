```typescript
await client.upsert(OLD_COLLECTION, {
    points: [
        {
            id: 1,
            vector: {
                text: "Example document",
                model: OLD_MODEL,
            },
            payload: { text: "Example document" },
        },
    ],
});
```
