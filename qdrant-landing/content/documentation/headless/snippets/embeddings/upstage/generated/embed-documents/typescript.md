```typescript
const documents = [
  "Qdrant is a vector database and similarity search engine.",
  "Upstage Solar Embedding models turn text into dense vectors.",
];

const response = await upstage.embeddings.create({
  model: "solar-embedding-2-passage",
  input: documents,
});

await client.upsert("{collection_name}", {
  points: response.data.map((item) => ({
    id: item.index,
    vector: item.embedding,
    payload: { text: documents[item.index] },
  })),
});
```
