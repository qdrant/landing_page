```typescript
client = new QdrantClient({ url: "https://localhost:6333", apiKey: "my-read-only-key" });

try {
    await client.delete("my_collection", { points: [1] });
} catch (e: any) {
    console.error(e.message); // 403 Forbidden
}
```
