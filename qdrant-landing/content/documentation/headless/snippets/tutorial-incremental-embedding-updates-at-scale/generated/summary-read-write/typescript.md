```typescript
// Digests are stored as decimal strings, for the 2^53 reason given above.

// Store bucket digests in the summary collection, one point per group.
// digests: the full list of N_BUCKETS digests.
// groups:  which group points to rewrite; defaults to all of them.
async function writeMeta(digests: string[], groups?: Iterable<number>) {
    const points = [];
    for (const g of groups ?? Array.from({ length: N_META }, (_, i) => i)) {
        // group g holds buckets [g * GROUP_SIZE .. g * GROUP_SIZE + GROUP_SIZE - 1]
        const start = g * GROUP_SIZE;
        points.push({
            id: g,
            vector: [1.0],  // dummy: this collection is never searched
            payload: { group: g, digests: digests.slice(start, start + GROUP_SIZE) },
        });
    }
    await client.upsert(META, { points, wait: true });
}

// Read the summary back as a flat list of N_BUCKETS digests.
async function readMeta(): Promise<string[]> {
    const digests = new Array<string>(N_BUCKETS).fill("0");
    const points = await client.retrieve(META, {
        ids: Array.from({ length: N_META }, (_, i) => i),
        with_payload: true,
    });
    for (const point of points) {
        const g = point.payload!.group as number;
        (point.payload!.digests as string[]).forEach((digest, slot) => {
            digests[g * GROUP_SIZE + slot] = digest;
        });
    }
    return digests;
}

await writeMeta(computeDigests(prepare(CHUNKS)));
await readMeta();
```
