```typescript
const documents = [
  "Qdrant is a vector search engine.",
  "Mistral embedding models turn text into dense vectors.",
];

const response = await mistral.embeddings.create({ model: MODEL, inputs: documents });

await client.upsert("{collection_name}", {
  points: response.data.map((item) => ({
    id: item.index!,
    vector: item.embedding!,
    payload: { text: documents[item.index!] },
  })),
});
```
