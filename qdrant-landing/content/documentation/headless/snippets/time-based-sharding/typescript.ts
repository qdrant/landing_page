import { QdrantClient } from "@qdrant/js-client-rest";

// @hide-start
const QDRANT_URL = "";
const QDRANT_API_KEY = "";
// @hide-end

// @block-start initialize-client
const client = new QdrantClient({
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY,
});
// @block-end initialize-client

// @block-start create-collection
const collectionName = "my_collection";

if (await client.collectionExists(collectionName)) {
    await client.deleteCollection(collectionName);
}

await client.createCollection(collectionName, {
    vectors: {
        dense_vector: {
            size: 384,
            distance: "Cosine",
        },
    },
    sharding_method: "custom",
});
// @block-end create-collection

// @block-start parse-csv
function parseCsvLine(line: string): string[] {
    const fields: string[] = [];
    let i = 0;
    while (i < line.length) {
        if (line[i] === '"') {
            i++;
            let field = "";
            while (i < line.length) {
                if (line[i] === '"' && line[i + 1] === '"') { field += '"'; i += 2; }
                else if (line[i] === '"') { i++; break; }
                else { field += line[i++]; }
            }
            fields.push(field);
            if (line[i] === ",") i++;
        } else {
            const start = i;
            while (i < line.length && line[i] !== ",") i++;
            fields.push(line.slice(start, i));
            if (i < line.length) i++;
        }
    }
    return fields;
}

async function* parseCSV(url: string): AsyncGenerator<{ text: string; datetime: string }> {
    const response = await fetch(url);
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let remainder = "";
    let headers: string[] | null = null;
    let textIdx = -1;
    let datetimeIdx = -1;

    while (true) {
        const { done, value } = await reader.read();
        const chunk = done ? "" : decoder.decode(value, { stream: true });
        const lines = (remainder + chunk).split("\n");
        remainder = done ? "" : lines.pop()!;

        for (const line of lines) {
            if (!line.trim()) continue;
            if (headers === null) {
                headers = line.split(",");
                textIdx = headers.indexOf("text");
                datetimeIdx = headers.indexOf("datetime");
                continue;
            }
            const fields = parseCsvLine(line);
            yield { text: fields[textIdx], datetime: fields[datetimeIdx] };
        }

        if (done) break;
    }
}
// @block-end parse-csv

// @block-start upload-vectors
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
// @block-end upload-vectors

// @block-start search-single-shard
const queryText = "coffee";

const singleShardResult = await client.query(collectionName, {
    query: { text: queryText, model: denseModel },
    using: "dense_vector",
    limit: 5,
    shard_key: "2026-04-07",
});

for (const hit of singleShardResult.points) {
    console.log(hit);
}
// @block-end search-single-shard

// @block-start search-multiple-shards
const multiShardResult = await client.query(collectionName, {
    query: { text: queryText, model: denseModel },
    using: "dense_vector",
    limit: 5,
    shard_key: ["2026-04-06", "2026-04-07"],
});

for (const hit of multiShardResult.points) {
    console.log(hit);
}
// @block-end search-multiple-shards

// @block-start search-all-shards
const allShardsResult = await client.query(collectionName, {
    query: { text: queryText, model: denseModel },
    using: "dense_vector",
    limit: 5,
});

for (const hit of allShardsResult.points) {
    console.log(hit);
}
// @block-end search-all-shards

// @block-start pruning-shards
const today = "2026-04-08";
const oldestDate = new Date(today);
oldestDate.setDate(oldestDate.getDate() - 7);
const oldestShardKey = oldestDate.toISOString().slice(0, 10);

await client.createShardKey(collectionName, { shard_key: today });
await client.deleteShardKey(collectionName, { shard_key: oldestShardKey });
// @block-end pruning-shards

// @block-start ingest-new-data
await client.upsert(collectionName, {
    points: [
        {
            id: crypto.randomUUID(),
            vector: {
                dense_vector: {
                    text: "The best way to start a Wednesday is with a cup of coffee",
                    model: denseModel,
                },
            },
            payload: {
                text: "The best way to start a Wednesday is with a cup of coffee",
                datetime: "2026-04-08T07:57:47",
            },
        },
    ],
    shard_key: today,
});
// @block-end ingest-new-data
