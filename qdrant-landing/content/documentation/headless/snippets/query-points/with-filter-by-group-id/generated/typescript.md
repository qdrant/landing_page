```typescript
client.query("{collection_name}", {
    query: [0.1, 0.1, 0.9],
    filter: {
        must: [{ key: "group_id", match: { value: "user_1" } }],
    },
    limit: 10,
});
```
