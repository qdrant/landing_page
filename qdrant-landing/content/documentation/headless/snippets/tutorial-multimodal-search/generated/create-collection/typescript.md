```typescript
const collectionName = "multimodal-embeddings";

if (!(await client.collectionExists(collectionName)).exists) {
    await client.createCollection(collectionName, {
        vectors: {
            image: { size: 512, distance: "Cosine" },
            text: { size: 512, distance: "Cosine" },
        },
    });
}
```
