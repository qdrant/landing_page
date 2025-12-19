```typescript
client.upsert("books", {
  wait: true,
  points: [
    {
      id: 1,
      vector: {
        "title-bm25": {
          text: "La Máquina del Tiempo",
          model: "qdrant/bm25",
          options: { language: "spanish" },
        },
      },
      payload: {
        title: "La Máquina del Tiempo",
        author: "H.G. Wells",
        isbn: "9788411486880",
      },
    },
  ],
});
```
