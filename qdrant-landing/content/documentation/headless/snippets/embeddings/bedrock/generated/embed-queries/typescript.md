```typescript
const { points: hits } = await client.query("{collection_name}", {
  query: await embed("What is Qdrant?"),
  limit: 3,
});
```
