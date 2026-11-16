```typescript
const documents = [
  "Qdrant is a vector search engine.",
  "Ollama runs open models on your own hardware.",
];

const response = await ollama.embed({ model: MODEL, input: documents });

await client.upsert("{collection_name}", {
  points: response.embeddings.map((vector, idx) => ({
    id: idx,
    vector,
    payload: { text: documents[idx] },
  })),
});
```
