```typescript
const oldVectorResults = await client.query(COLLECTION, {
    query: {
        text: "my query",
        model: OLD_MODEL,
    },
    using: OLD_VECTOR,
    limit: 10,
});
```
