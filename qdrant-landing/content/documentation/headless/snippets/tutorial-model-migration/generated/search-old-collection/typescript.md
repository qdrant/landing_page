```typescript
const results = await client.query(OLD_COLLECTION, {
    query: {
        text: "my query",
        model: OLD_MODEL,
    },
    limit: 10,
});
```
