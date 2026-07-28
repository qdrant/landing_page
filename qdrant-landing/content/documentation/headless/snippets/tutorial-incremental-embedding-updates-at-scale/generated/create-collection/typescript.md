```typescript
const MAIN = "docs-sync-scale";
const MODEL = "sentence-transformers/all-MiniLM-L6-v2";

if (!(await client.collectionExists(MAIN)).exists) {
    await client.createCollection(MAIN, {
        vectors: { size: 384, distance: "Cosine" },
    });
    await client.updateCollection(MAIN, {
        metadata: { embedding_model: MODEL, pipeline_version: "1" },
    });
    await client.createPayloadIndex(MAIN, { field_name: "sync_bucket", field_schema: "integer" });
}
```
