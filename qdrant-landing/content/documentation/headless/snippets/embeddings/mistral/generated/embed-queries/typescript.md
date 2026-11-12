```typescript
const queryResponse = await mistral.embeddings.create({
  model: MODEL,
  inputs: ["What is Qdrant?"],
});

const queryVector = queryResponse.data[0].embedding;
if (!queryVector) throw new Error("Mistral returned no query embedding");

const { points: hits } = await client.query("{collection_name}", {
  query: queryVector,
  limit: 3,
});
```
