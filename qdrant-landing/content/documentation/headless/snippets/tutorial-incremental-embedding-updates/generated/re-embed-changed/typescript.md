```typescript
async function reEmbedChanged(contentChanged: SyncChunk[]) {
    if (contentChanged.length === 0) {
        return;
    }
    await client.upsert(COLLECTION, {
        points: contentChanged.map((c) => ({
            id: c.point_id,
            vector: { text: c.text, model: MODEL },
            payload: payload(c),
        })),
        wait: true,
    });
}
```
