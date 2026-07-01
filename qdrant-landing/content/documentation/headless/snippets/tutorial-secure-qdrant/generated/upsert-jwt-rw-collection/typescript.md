```typescript
client = new QdrantClient({ url: "https://localhost:6333", apiKey: "<your-jwt>" });

await client.upsert("my_collection", {
    points: [{ id: 2, vector: [0.5, 0.6, 0.7, 0.8] }],
});
```
