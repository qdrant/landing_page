```typescript
const documents = [
  "Qdrant is a vector search engine.",
  "Gemini embedding models map text, images, video, audio, and PDFs into one vector space.",
];

const response = await gemini.models.embedContent({
  model: MODEL,
  contents: documents.map((doc) => ({ parts: [{ text: `title: none | text: ${doc}` }] })),
});

await client.upsert("{collection_name}", {
  points: response.embeddings!.map((embedding, idx) => ({
    id: idx,
    vector: embedding.values!,
    payload: { text: documents[idx] },
  })),
});
```
