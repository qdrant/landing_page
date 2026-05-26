```typescript
const newVectorResults = await client.query(COLLECTION, {
    query: {
        text: "my query",
        model: NEW_MODEL,
    },
    using: NEW_VECTOR,
    limit: 10,
});
```
