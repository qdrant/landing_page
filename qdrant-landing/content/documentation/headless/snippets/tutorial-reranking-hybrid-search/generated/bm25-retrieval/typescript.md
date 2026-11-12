```typescript
const bm25Results = await client.query(collectionName, {
    query: { text: query },
    using: "description",
    limit: 10,
});

console.log(bm25Results.points);
```
