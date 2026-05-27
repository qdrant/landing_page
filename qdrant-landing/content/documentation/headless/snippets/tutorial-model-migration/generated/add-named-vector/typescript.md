```typescript
await client.createVectorName(COLLECTION, NEW_VECTOR, {
    dense: {
        size: 512, // Size of the new embedding vectors
        distance: "Cosine", // Similarity function for the new model
    },
});
```
