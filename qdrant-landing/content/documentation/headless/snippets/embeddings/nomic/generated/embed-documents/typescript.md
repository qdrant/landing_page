```typescript
const documents = [
  "Qdrant is a vector search engine.",
  "Nomic Embed models turn text into dense vectors.",
  "Paris is the capital of France.",
];

const embeddings = await embed(documents, "search_document");

await client.upsert("{collection_name}", {
  points: embeddings.map((vector, idx) => ({
    id: idx,
    vector,
    payload: { text: documents[idx] },
  })),
});
```
