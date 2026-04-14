```typescript
const csvUrl = "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/sci-fi-books/top_100_scifi_books_full.csv";

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

const batchSize = 25;
let idx = 0;
let buffer: Schemas["PointStruct"][] = [];

const response = await fetch(csvUrl);
const text = await response.text();
const [_header, ...rows] = text.trim().split("\n");

for (const row of rows) {
    const fields = parseCsvLine(row);
    const title = fields[0];
    const author = fields[1];
    const description = fields[3];

    buffer.push({
        id: idx++,
        vector: {
            dense: { text: description, model: denseEmbeddingModel },
            sparse: { text: description, model: sparseEmbeddingModel },
            multi: { text: description, model: lateInteractionEmbeddingModel },
        },
        payload: { title, author, description },
    });

    if (buffer.length >= batchSize) {
        await client.upsert(collectionName, { points: buffer });
        buffer = [];
    }
}

if (buffer.length > 0) {
    await client.upsert(collectionName, { points: buffer });
}
```
