```typescript
let reEmbedLastOffset: number | string | undefined = undefined;
const reEmbedBatchSize = 100;
let reEmbedReachedEnd = false;

while (!reEmbedReachedEnd) {
    const reEmbedScrollResult = await client.scroll(COLLECTION, {
        limit: reEmbedBatchSize,
        offset: reEmbedLastOffset,
        with_payload: true,
        with_vector: false,
    });

    const records = reEmbedScrollResult.points;
    reEmbedLastOffset = reEmbedScrollResult.next_page_offset as number | string | undefined;

    // Update only the new vector on each point; the old vector and payload are untouched
    await client.updateVectors(COLLECTION, {
        points: records.map((record) => ({
            id: record.id,
            vector: {
                [NEW_VECTOR]: {
                    text: ((record.payload?.text as string) ?? ""),
                    model: NEW_MODEL,
                },
            },
        })),
    });

    reEmbedReachedEnd = reEmbedLastOffset == null;
}
```
