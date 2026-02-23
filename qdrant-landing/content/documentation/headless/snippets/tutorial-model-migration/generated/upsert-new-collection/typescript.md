```typescript
await client.upsert(NEW_COLLECTION, {
    points: [
        {
            id: 1,
            // Use the new embedding model to encode the document
            vector: {
                text: "Example document",
                model: NEW_MODEL,
            },
            payload: { text: "Example document" },
        },
    ],
});
```
