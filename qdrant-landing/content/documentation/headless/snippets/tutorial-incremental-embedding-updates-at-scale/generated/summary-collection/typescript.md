```typescript
const META = "docs-sync-digests";
const N_META = N_BUCKETS / GROUP_SIZE;

if (!(await client.collectionExists(META)).exists) {
    await client.createCollection(META, {
        vectors: { size: 1, distance: "Cosine" },
    });
}
```
