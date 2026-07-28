```typescript
// Return a map of point_id to content_hash for every chunk stored in bucket b.
// Pages through the results so nothing is missed in a large bucket.
async function readBucket(b: number): Promise<Map<string, string>> {
    const stored = new Map<string, string>();
    let offset: Schemas["ExtendedPointId"] | null | undefined = undefined;
    do {
        const page = await client.scroll(MAIN, {
            filter: { must: [{ key: "sync_bucket", match: { value: b } }] },
            with_payload: ["content_hash"],
            with_vector: false,
            limit: 1000,
            offset,
        });
        for (const point of page.points) {
            stored.set(String(point.id), point.payload!.content_hash as string);
        }
        offset = page.next_page_offset;
    } while (offset !== null && offset !== undefined);
    return stored;
}
```
