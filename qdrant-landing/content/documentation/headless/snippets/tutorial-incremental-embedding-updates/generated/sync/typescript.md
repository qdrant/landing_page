```typescript
async function sync(latestChunks: RawChunk[]) {
    await checkGate(); // refuse to mix embedding models or pipeline versions

    const chunks = prepareChunksForSync(latestChunks);
    const { incoming, unchanged, contentChanged, unknownIds } = await splitByState(chunks);

    await reEmbedChanged(contentChanged);
    const { reused, added } = await reuseOrAdd(unknownIds);
    const deleted = await deleteGone(incoming);

    return {
        "unchanged": unchanged.length,
        "re-embedded": contentChanged.length,
        "reused_embedding": reused,
        "added": added,
        "deleted": deleted,
    };
}
```
