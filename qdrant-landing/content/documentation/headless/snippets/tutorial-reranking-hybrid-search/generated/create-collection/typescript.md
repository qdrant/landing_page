```typescript
const collectionName = "hybrid-search";

if (await client.collectionExists(collectionName)) {
    await client.deleteCollection(collectionName);
}

await client.createCollection(collectionName, {
    vectors: {
        dense: {
            size: 384,
            distance: "Cosine",
        },
        multi: {
            size: 96,
            distance: "Cosine",
            multivector_config: { comparator: "max_sim" },
            hnsw_config: { m: 0 }, // Disable HNSW for reranking
        },
    },
    sparse_vectors: {
        sparse: { modifier: "idf" },
    },
});
```
