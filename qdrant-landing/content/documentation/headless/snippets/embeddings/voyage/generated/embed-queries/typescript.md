```typescript
const queryResponse = await voyage.embed({
  input: ["What is Qdrant?"],
  model: "voyage-4-large",
  inputType: "query",
});

const queryVector = queryResponse.data?.[0]?.embedding;
if (!queryVector) throw new Error("Voyage AI returned no query embedding");

const { points: hits } = await client.query("{collection_name}", {
  query: queryVector,
  limit: 3,
});
```
