```typescript
const TASK =
  "Given a web search query, retrieve relevant passages that answer the query";

const queryResponse = await ollama.embed({
  model: MODEL,
  input: `Instruct: ${TASK}\nQuery:What is Qdrant?`,
});

const { points: hits } = await client.query("{collection_name}", {
  query: queryResponse.embeddings[0],
  limit: 3,
});
```
