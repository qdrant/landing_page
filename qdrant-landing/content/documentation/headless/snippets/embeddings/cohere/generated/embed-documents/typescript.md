```typescript
const documents = [
  "Qdrant is a vector database and similarity search engine.",
  "Cohere Embed models turn text and images into dense vectors.",
];

const response = await cohere.embed({
  model: "embed-v5.0-pro",
  inputType: "search_document",
  texts: documents,
  embeddingTypes: ["float"],
});

await client.upsert("{collection_name}", {
  points: response.embeddings.float!.map((vector, idx) => ({
    id: idx,
    vector,
    payload: { text: documents[idx] },
  })),
});
```
