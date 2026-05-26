```typescript
client = new QdrantClient({ url: "https://localhost:6333", apiKey: "my-admin-key" });

await client.createCollection("my_collection", {
    vectors: { size: 4, distance: "Cosine" },
});

await client.upsert("my_collection", {
    points: [{ id: 1, vector: [0.1, 0.2, 0.3, 0.4] }],
});
```
