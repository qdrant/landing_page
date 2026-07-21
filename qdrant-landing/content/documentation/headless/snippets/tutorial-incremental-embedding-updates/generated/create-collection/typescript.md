```typescript
const MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const PIPELINE = "docs-prep-pipeline-v1";
const COLLECTION = "docs-sync-tutorial";

await client.createCollection(COLLECTION, {
    vectors: {
        size: 384, // all-MiniLM-L6-v2 output dimension
        distance: "Cosine",
    },
});

await client.updateCollection(COLLECTION, {
    metadata: { embedding_model: MODEL, pipeline_version: PIPELINE },
});
```
