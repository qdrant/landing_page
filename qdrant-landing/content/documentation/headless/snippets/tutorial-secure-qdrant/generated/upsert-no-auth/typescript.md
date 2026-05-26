```typescript
client = new QdrantClient({ url: "https://localhost:6333" });

try {
    await client.upsert("my_collection", {
        points: [{ id: 1, vector: [0.1, 0.2, 0.3, 0.4] }],
    });
} catch (e: any) {
    console.error(e.message); // 401 Unauthorized
}
```
