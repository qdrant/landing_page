```typescript
async function sync(latestChunks: RawChunk[]) {
    const latest = prepare(latestChunks);

    // group the source chunks by bucket once
    const sourceByBucket = new Map<number, Map<string, SyncChunk>>();
    for (const c of latest) {
        const b = bucket(c.point_id);
        if (!sourceByBucket.has(b)) {
            sourceByBucket.set(b, new Map());
        }
        sourceByBucket.get(b)!.set(c.point_id, c);
    }

    // steps 1-3: which buckets changed
    const source = computeDigests(latest);
    const stored = await readMeta();
    const changed: number[] = [];
    for (let b = 0; b < N_BUCKETS; b++) {
        if (source[b] !== stored[b]) {
            changed.push(b);
        }
    }

    // step 4: reconcile each changed bucket
    const report = { changed_buckets: changed, added: 0, re_embedded: 0, deleted: 0 };
    for (const b of changed) {
        const counts = await reconcileBucket(b, sourceByBucket.get(b) ?? new Map());
        report.added += counts.added;
        report.re_embedded += counts.reEmbedded;
        report.deleted += counts.deleted;
    }

    // step 5: rewrite only the changed groups of the summary, after the data writes
    const changedGroups = new Set<number>();
    for (const b of changed) {
        changedGroups.add(Math.floor(b / GROUP_SIZE));
    }
    await writeMeta(source, changedGroups);

    return report;
}
```
