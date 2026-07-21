```typescript
// Compare the incoming chunk list to the collection: who is unchanged, changed, or unknown.
async function splitByState(latestChunks: SyncChunk[]) {
    const incoming = new Map(latestChunks.map((c) => [c.point_id, c]));

    const stored = new Map<string, string>();
    const points = await client.retrieve(COLLECTION, {
        ids: [...incoming.keys()],
        with_payload: ["content_hash"],
        with_vector: false,
    });
    for (const p of points) {
        stored.set(String(p.id), p.payload?.content_hash as string);
    }

    const unchanged: SyncChunk[] = [];
    const contentChanged: SyncChunk[] = [];
    const unknownIds: SyncChunk[] = [];
    for (const [pid, c] of incoming) {
        if (stored.get(pid) === c.content_hash) {
            unchanged.push(c);
        } else if (stored.has(pid)) {
            contentChanged.push(c);
        } else {
            unknownIds.push(c);
        }
    }

    return { incoming, unchanged, contentChanged, unknownIds };
}

const { incoming, unchanged, contentChanged, unknownIds } = await splitByState(LATEST_CHUNKS);
```
