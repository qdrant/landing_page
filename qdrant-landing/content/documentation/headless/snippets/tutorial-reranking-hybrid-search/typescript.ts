import { QdrantClient, Schemas } from "@qdrant/js-client-rest";

// @hide-start
const QDRANT_URL = "https://xyz-example.eu-central.aws.cloud.qdrant.io";
const QDRANT_API_KEY = "<your-api-key>";
// @hide-end
// @block-start client-connection
const client = new QdrantClient({
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY,
});
// @block-end client-connection

// @block-start define-models
const denseEmbeddingModel = "sentence-transformers/all-MiniLM-L6-v2";
const sparseEmbeddingModel = "qdrant/bm25";
const lateInteractionEmbeddingModel = "answerdotai/answerai-colbert-small-v1";
// @block-end define-models

// @block-start create-collection
const collectionName = "hybrid-search";

if (await client.collectionExists(collectionName)) {
    await client.deleteCollection(collectionName);
}

await client.createCollection(collectionName, {
    vectors: {
        dense: {
            size: 384,
            distance: "Cosine",
        },
        multi: {
            size: 96,
            distance: "Cosine",
            multivector_config: { comparator: "max_sim" },
            hnsw_config: { m: 0 }, // Disable HNSW for reranking
        },
    },
    sparse_vectors: {
        sparse: { modifier: "idf" },
    },
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

async function* parseCSV(url: string): AsyncGenerator<{ title: string; author: string; description: string }> {
    const response = await fetch(url);
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let remainder = "";
    let headers: string[] | null = null;
    let titleIdx = -1;
    let authorIdx = -1;
    let descriptionIdx = -1;

    while (true) {
        const { done, value } = await reader.read();
        const chunk = done ? "" : decoder.decode(value, { stream: true });
        const lines = (remainder + chunk).split("\n");
        remainder = done ? "" : lines.pop()!;

        for (const line of lines) {
            if (!line.trim()) continue;
            if (headers === null) {
                headers = parseCsvLine(line);
                titleIdx = headers.indexOf("Title");
                authorIdx = headers.indexOf("Author");
                descriptionIdx = headers.indexOf("Description");
                continue;
            }
            const fields = parseCsvLine(line);
            yield { title: fields[titleIdx], author: fields[authorIdx], description: fields[descriptionIdx] };
        }

        if (done) break;
    }
}
// @block-end parse-csv

// @block-start ingest-data
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
// @block-end ingest-data

// @block-start dense-retrieval
const query = "time travel";

const denseResults = await client.query(collectionName, {
    query: { text: query, model: denseEmbeddingModel },
    using: "dense",
    limit: 10,
});

console.log(denseResults.points);
// @block-end dense-retrieval

// @block-start sparse-retrieval
const sparseResults = await client.query(collectionName, {
    query: { text: query, model: sparseEmbeddingModel },
    using: "sparse",
    limit: 10,
});

console.log(sparseResults.points);
// @block-end sparse-retrieval

// @block-start hybrid-search
const hybridResults = await client.query(collectionName, {
    prefetch: [
        {
            query: { text: query, model: denseEmbeddingModel },
            using: "dense",
            limit: 20,
        },
        {
            query: { text: query, model: sparseEmbeddingModel },
            using: "sparse",
            limit: 20,
        },
    ],
    query: { fusion: "rrf" },
    with_payload: true,
    limit: 10,
});

console.log(hybridResults.points);
// @block-end hybrid-search

// @block-start rerank
const rerankedResults = await client.query(collectionName, {
    prefetch: [
        {
            query: { text: query, model: denseEmbeddingModel },
            using: "dense",
            limit: 20,
        },
        {
            query: { text: query, model: sparseEmbeddingModel },
            using: "sparse",
            limit: 20,
        },
    ],
    query: { text: query, model: lateInteractionEmbeddingModel },
    using: "multi",
    with_payload: true,
    limit: 10,
});

console.log(rerankedResults.points);
// @block-end rerank
