```typescript
const documents = [
  "Qdrant is a vector database and similarity search engine.",
  "OpenAI embedding models turn text into dense vectors.",
];

const response = await openai.embeddings.create({ model: MODEL, input: documents });

await client.upsert("{collection_name}", {
  points: response.data.map((item) => ({
    id: item.index,
    vector: item.embedding,
    payload: { text: documents[item.index] },
  })),
});
```
