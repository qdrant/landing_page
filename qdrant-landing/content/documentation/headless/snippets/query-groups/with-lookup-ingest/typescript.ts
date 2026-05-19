import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

await client.upsert("documents", {
    points: [
        {
            id: 1,
            vector: {},
            payload: { title: "Document A", text: "This is document A" },
        },
        {
            id: 2,
            vector: {},
            payload: { title: "Document B", text: "This is document B" },
        },
    ],
});

await client.upsert("chunks", {
    points: [
        {
            id: 0,
            vector: [0.1, 0.2, 0.3, 0.4],
            payload: { document_id: 1 },
        },
        {
            id: 1,
            vector: [0.5, 0.6, 0.7, 0.8],
            payload: { document_id: 2 },
        },
    ],
});
