```typescript
client.upsert("books", {
  wait: true,
  points: [
    {
      id: 1,
      vector: {
        "title-bm25": {
          text: "The Time Machine",
          model: "qdrant/bm25",
          options: { avg_len: 5.0 },
        },
      },
      payload: {
        title: "The Time Machine",
        author: "H.G. Wells",
        isbn: "9780553213515",
      },
    },
  ],
});
```
