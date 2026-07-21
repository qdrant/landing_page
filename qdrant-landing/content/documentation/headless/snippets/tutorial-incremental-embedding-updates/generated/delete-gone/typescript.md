```typescript
// Remove every point the current crawl no longer contains. Returns how many.
async function deleteGone(incoming: Map<string, SyncChunk>) {
    if (incoming.size === 0) {
        throw new Error("Refusing to delete from an empty source snapshot.");
    }

    const stale = { must_not: [{ has_id: [...incoming.keys()] }] };

    const toDelete = (await client.count(COLLECTION, { filter: stale })).count;

    // potential check against a threshold to avoid accidental mass deletion could be added here
    await client.delete(COLLECTION, { filter: stale, wait: true });
    return toDelete;
}
```
