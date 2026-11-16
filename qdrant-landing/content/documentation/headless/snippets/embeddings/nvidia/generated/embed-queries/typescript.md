```typescript
const queryResponse = await nvidiaEmbed({
  model: MODEL,
  input: ["What is Qdrant?"],
  input_type: "query",
  truncate: "END",
});

const { points: hits } = await client.query("{collection_name}", {
  query: queryResponse.data[0].embedding,
  limit: 3,
});
```
