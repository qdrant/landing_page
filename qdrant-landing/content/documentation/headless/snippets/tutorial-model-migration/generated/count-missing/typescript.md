```typescript
await client.count(COLLECTION, {
    filter: {
        must_not: [
            {
                has_vector: NEW_VECTOR,
            },
        ],
    },
    exact: true,
});
```
