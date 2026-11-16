```typescript
type MultiItem = { index: number; embeddings: number[][] };

await client.createCollection("{colbert_collection_name}", {
  vectors: { size: 128, distance: "Cosine", multivector_config: { comparator: "max_sim" } },
});

const colbertData = await jinaEmbed<MultiItem>({
  model: "jina-colbert-v2",
  input_type: "document",
  input: documents,
});

await client.upsert("{colbert_collection_name}", {
  points: colbertData.map((item) => ({
    id: item.index,
    vector: item.embeddings,
    payload: { text: documents[item.index] },
  })),
});

const [colbertQuery] = await jinaEmbed<MultiItem>({
  model: "jina-colbert-v2",
  input_type: "query",
  input: ["What is Qdrant?"],
});

const { points: colbertHits } = await client.query("{colbert_collection_name}", {
  query: colbertQuery.embeddings,
  limit: 3,
});
```
