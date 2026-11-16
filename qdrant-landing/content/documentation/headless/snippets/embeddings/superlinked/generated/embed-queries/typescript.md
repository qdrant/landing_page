```typescript
const queryResult = await sie.encode(
  MODEL,
  { text: "What is Qdrant?" },
  { isQuery: true },
);

const { points: hits } = await client.query("{collection_name}", {
  query: denseEmbedding(queryResult),
  limit: 3,
});
```
