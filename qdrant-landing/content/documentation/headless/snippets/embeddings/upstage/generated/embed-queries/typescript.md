```typescript
const queryResponse = await upstage.embeddings.create({
  model: "solar-embedding-2-query",
  input: "What is Qdrant?",
});

const { points: hits } = await client.query("{collection_name}", {
  query: queryResponse.data[0].embedding,
  limit: 3,
});
```
