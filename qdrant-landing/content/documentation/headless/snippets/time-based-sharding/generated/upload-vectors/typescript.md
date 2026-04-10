```typescript
const csvUrl = "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/time-based-sharding/social-media-posts.csv";

const shardKeysResult = await client.listShardKeys(collectionName);
const existingShardKeys = new Set((shardKeysResult.shard_keys ?? []).map((d) => String(d.key)));

const denseModel = "sentence-transformers/all-MiniLM-L6-v2";
const batchSize = 100;
let currentDate = "";
let buffer: Extract<Parameters<typeof client.upsert>[1], { points: unknown }>['points'] = [];

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

const response = await fetch(csvUrl);
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
        const postText = fields[textIdx];
        const datetime = fields[datetimeIdx];
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

        buffer.push({
            id: crypto.randomUUID(),
            vector: { dense_vector: { text: postText, model: denseModel } },
            payload: { text: postText, datetime },
        });

        if (buffer.length >= batchSize) {
            await client.upsert(collectionName, { points: buffer, shard_key: currentDate });
            buffer = [];
        }
    }

    if (done) break;
}

// Flush remaining partial batch
if (buffer.length > 0) {
    await client.upsert(collectionName, { points: buffer, shard_key: currentDate });
}
```
