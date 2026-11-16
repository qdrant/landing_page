```typescript
const images = ["https://i.ibb.co/nQNGqL0/beach1.jpg", "https://i.ibb.co/r5w8hG8/beach2.jpg"];

const imageData = await jinaEmbed({
  model: "jina-embeddings-v5-omni-small",
  task: "retrieval.passage",
  input: images.map((url) => ({ image: url })),
});

await client.upsert("{collection_name}", {
  points: imageData.map((item) => ({
    id: 100 + item.index,
    vector: item.embedding,
    payload: { image: images[item.index] },
  })),
});
```
