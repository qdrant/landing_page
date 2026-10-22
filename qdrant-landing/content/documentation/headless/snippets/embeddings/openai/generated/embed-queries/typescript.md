```typescript
const queryResponse = await openai.embeddings.create({
  model: MODEL,
  input: "What is Qdrant?",
});

const { points: hits } = await client.query("{collection_name}", {
  query: queryResponse.data[0].embedding,
  limit: 3,
});
```
