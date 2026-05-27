```typescript
await client.upsert(COLLECTION, {
    points: [
        {
            id: 1,
            vector: {
                [OLD_VECTOR]: {
                    text: "Example document",
                    model: OLD_MODEL,
                },
                [NEW_VECTOR]: {
                    text: "Example document",
                    model: NEW_MODEL,
                },
            },
            payload: { text: "Example document" },
        },
    ],
});
```
