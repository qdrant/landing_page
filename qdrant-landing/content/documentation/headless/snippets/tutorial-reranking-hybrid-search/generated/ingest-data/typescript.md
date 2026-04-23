```typescript
const csvUrl = "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/sci-fi-books/top_100_scifi_books_full.csv";

const batchSize = 25;
let idx = 0;
let buffer: Schemas["PointStruct"][] = [];

for await (const { title, author, description } of parseCSV(csvUrl)) {
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
