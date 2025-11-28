```typescript
client.upsert("{collection_name}", {
    points: [
        {
            id: 1,
            vector: {
                image: [0.9, 0.1, 0.1, 0.2],
                text: [0.4, 0.7, 0.1, 0.8, 0.1],
                text_sparse: {
                    indices: [1, 3, 5, 7],
                    values: [0.1, 0.2, 0.3, 0.4]
                }
            },
        },
    ],
});
```
