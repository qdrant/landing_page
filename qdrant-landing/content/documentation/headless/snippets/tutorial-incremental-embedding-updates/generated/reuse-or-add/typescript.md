```typescript
// Reuse an existing embedding when the same text is already stored; embed only what is new.
async function reuseOrAdd(unknownIds: SyncChunk[]) {
    let reused = 0;
    let added = 0;

    for (const c of unknownIds) {
        const sameText = {
            must: [
                {
                    key: "content_hash",
                    match: { value: c.content_hash },
                },
            ],
        };
        const hits = (await client.scroll(COLLECTION, {
            filter: sameText,
            limit: 1,
            with_payload: ["last_updated"],
            with_vector: true,
        })).points;

        let point: Schemas["PointStruct"];
        if (hits.length > 0) { // same text, new address: copy the vector, keep its last_updated
            point = {
                id: c.point_id,
                vector: hits[0].vector as number[],
                payload: payload(c, hits[0].payload?.last_updated as string),
            };
            reused += 1;
        } else { // genuinely new content: embed and insert
            point = {
                id: c.point_id,
                vector: { text: c.text, model: MODEL },
                payload: payload(c),
            };
            added += 1;
        }

        await client.upsert(COLLECTION, { points: [point], wait: true });
    }

    return { reused, added };
}
```
