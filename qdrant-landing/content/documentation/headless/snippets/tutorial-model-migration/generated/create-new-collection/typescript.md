```typescript
await client.createCollection(NEW_COLLECTION, {
    vectors: {
        size: 512, // Size of the new embedding vectors
        distance: "Cosine", // Similarity function for the new model
    },
});
```
