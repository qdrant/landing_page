```typescript
const documents = [
  "Qdrant is a vector database and similarity search engine.",
  "NVIDIA Nemotron embedding models turn text into dense vectors.",
];

const response = await nvidiaEmbed({
  model: MODEL,
  input: documents,
  input_type: "passage",
  truncate: "END",
});

await client.upsert("{collection_name}", {
  points: response.data.map((item) => ({
    id: item.index,
    vector: item.embedding,
    payload: { text: documents[item.index] },
  })),
});
```
