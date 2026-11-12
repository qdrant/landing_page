```typescript
const [queryVector] = await embed(["What is Qdrant?"], "search_query");

const { points: hits } = await client.query("{collection_name}", {
  query: queryVector,
  limit: 3,
});
```
