```typescript
const embeddingModel = "sentence-transformers/all-minilm-l6-v2";

const points = documents.map((doc, idx) => ({
    id: idx,
    vector: {
        text: doc.description,
        model: embeddingModel,
    },
    payload: doc,
}));

await client.upsert(collectionName, { points });
```
