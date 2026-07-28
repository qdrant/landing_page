```typescript
// Make bucket b in Qdrant match sourceChunks. Returns the counts of what it did.
async function reconcileBucket(b: number, sourceChunks: Map<string, SyncChunk>) {
    const stored = await readBucket(b);   // point_id -> content_hash currently in Qdrant

    const toWrite: SyncChunk[] = [];      // new or content-changed chunks: embed and upsert
    let added = 0;
    let reEmbedded = 0;
    for (const [pid, chunk] of sourceChunks) {
        if (!stored.has(pid)) {
            toWrite.push(chunk);          // new chunk in this bucket
            added += 1;
        } else if (stored.get(pid) !== chunk.content_hash) {
            toWrite.push(chunk);          // same chunk, changed text
            reEmbedded += 1;
        }
    }

    const toDelete: string[] = [];        // chunks Qdrant has but the source no longer does
    for (const pid of stored.keys()) {
        if (!sourceChunks.has(pid)) {
            toDelete.push(pid);
        }
    }

    if (toWrite.length > 0) {
        await client.upsert(MAIN, { points: asPoints(toWrite), wait: true });
    }
    if (toDelete.length > 0) {
        await client.delete(MAIN, { points: toDelete, wait: true });
    }

    return { added, reEmbedded, deleted: toDelete.length };
}
```
