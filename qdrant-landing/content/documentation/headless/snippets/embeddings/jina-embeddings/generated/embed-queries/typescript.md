```typescript
const [queryItem] = await jinaEmbed({ model: MODEL, task: "retrieval.query", input: ["What is Qdrant?"] });

const { points: hits } = await client.query("{collection_name}", {
  query: queryItem.embedding,
  limit: 3,
});
```
