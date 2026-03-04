```typescript
const resultsNew = await client.query(NEW_COLLECTION, {
    query: {
        text: "my query",
        model: NEW_MODEL,
    },
    limit: 10,
});
```
