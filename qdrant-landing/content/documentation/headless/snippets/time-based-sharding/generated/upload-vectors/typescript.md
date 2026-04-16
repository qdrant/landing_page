```typescript
const csvUrl = "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/time-based-sharding/social-media-posts.csv";

// Retrieve a list of existing shard keys in the collection
const shardKeysResult = await client.listShardKeys(collectionName);
const existingShardKeys = new Set((shardKeysResult.shard_keys ?? []).map((d) => String(d.key)));

const denseModel = "sentence-transformers/all-MiniLM-L6-v2";
const batchSize = 100;
let currentDate = "";
let buffer: Extract<Parameters<typeof client.upsert>[1], { points: unknown }>['points'] = [];

for await (const { text: postText, datetime } of parseCSV(csvUrl)) {
    const shardDate = datetime.slice(0, 10); // Extract YYYY-MM-DD

    if (shardDate !== currentDate) {
        // Flush buffer for the previous date before switching
        if (buffer.length > 0) {
            await client.upsert(collectionName, { points: buffer, shard_key: currentDate });
            buffer = [];
        }

        // Create shard for the new date if it doesn't exist yet
        if (!existingShardKeys.has(shardDate)) {
            await client.createShardKey(collectionName, { shard_key: shardDate });
            existingShardKeys.add(shardDate);
        }

        currentDate = shardDate;
    }

    // Add point to buffer
    buffer.push({
        id: crypto.randomUUID(),
        vector: { dense_vector: { text: postText, model: denseModel } },
        payload: { text: postText, datetime },
    });

    // Flush batch if buffer size exceeds batch size
    if (buffer.length >= batchSize) {
        await client.upsert(collectionName, { points: buffer, shard_key: currentDate });
        buffer = [];
    }
}

// Flush remaining partial batch
if (buffer.length > 0) {
    await client.upsert(collectionName, { points: buffer, shard_key: currentDate });
}
```
