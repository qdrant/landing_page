```typescript
const collectionName = "my_collection";

if (await client.collectionExists(collectionName)) {
    await client.deleteCollection(collectionName);
}

await client.createCollection(collectionName, {
    vectors: {
        dense_vector: {
            size: 384,
            distance: "Cosine",
        },
    },
    sharding_method: "custom",
});
```
