```typescript
const documents = [
  "Qdrant is a vector database and similarity search engine.",
  "Voyage AI embedding models turn text into dense vectors.",
];

const response = await voyage.embed({
  input: documents,
  model: "voyage-4-large",
  inputType: "document",
});

await client.upsert("{collection_name}", {
  points: response.data!.map((item) => ({
    id: item.index!,
    vector: item.embedding!,
    payload: { text: documents[item.index!] },
  })),
});
```
