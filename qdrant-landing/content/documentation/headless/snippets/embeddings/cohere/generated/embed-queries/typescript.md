```typescript
const queryResponse = await cohere.embed({
  model: "embed-v5.0-fast",
  inputType: "search_query",
  texts: ["What is Qdrant?"],
  embeddingTypes: ["float"],
});

const queryVector = queryResponse.embeddings.float?.[0];
if (!queryVector) throw new Error("Cohere returned no query embedding");

const { points: hits } = await client.query("{collection_name}", {
  query: queryVector,
  limit: 3,
});
```
