```typescript
let lastOffset: number | string | undefined = undefined;
const batchSize = 100; // Number of points to read in each batch
let reachedEnd = false;

while (!reachedEnd) {
    // Get the next batch of points from the old collection
    const scrollResult = await client.scroll(OLD_COLLECTION, {
        limit: batchSize,
        offset: lastOffset,
        // Include payloads in the response, as we need them to re-embed the vectors
        with_payload: true,
        // We don't need the old vectors, so let's save on the bandwidth
        with_vector: false,
    });

    const records = scrollResult.points;
    lastOffset = scrollResult.next_page_offset as number | string | undefined;

    // Re-embed the points using the new model
    const points = records.map((record) => ({
        // Keep the original ID to ensure consistency
        id: record.id,
        // Use the new embedding model to encode the text from the payload,
        // assuming that was the original source of the embedding
        vector: {
            text: ((record.payload?.text as string) ?? ""),
            model: NEW_MODEL,
        },
        // Keep the original payload
        payload: record.payload,
    }));

    // Upsert the re-embedded points into the new collection
    await client.upsert(NEW_COLLECTION, {
        points,
        // Only insert the point if a point with this ID does not already exist.
        update_mode: "insert_only" as const,
    });

    // Check if we reached the end of the collection
    reachedEnd = lastOffset == null;
}
```
