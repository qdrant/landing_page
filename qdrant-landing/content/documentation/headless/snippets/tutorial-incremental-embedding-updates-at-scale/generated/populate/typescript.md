```typescript
function asPoints(chunks: SyncChunk[]): Schemas["PointStruct"][] {
    return chunks.map((c) => ({
        id: c.point_id,
        vector: { text: c.text, model: MODEL },  // embedded by Qdrant Cloud Inference
        payload: payload(c),
    }));
}

await client.upsert(MAIN, { points: asPoints(prepare(CHUNKS)), wait: true });
```
