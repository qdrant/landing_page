```typescript
const documents = [
  "Qdrant is a vector search engine.",
  "Jina AI embedding models turn text, images, and video into dense vectors.",
];

const data = await jinaEmbed({ model: MODEL, task: "retrieval.passage", input: documents });

await client.upsert("{collection_name}", {
  points: data.map((item) => ({
    id: item.index,
    vector: item.embedding,
    payload: { text: documents[item.index] },
  })),
});
```
