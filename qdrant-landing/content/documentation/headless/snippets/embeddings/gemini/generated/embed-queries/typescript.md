```typescript
const queryResponse = await gemini.models.embedContent({
  model: MODEL,
  contents: "task: search result | query: What is Qdrant?",
});

const queryVector = queryResponse.embeddings?.[0]?.values;
if (!queryVector) throw new Error("Gemini returned no query embedding");

const { points: hits } = await client.query("{collection_name}", {
  query: queryVector,
  limit: 3,
});
```
