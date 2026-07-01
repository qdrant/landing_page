import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.queryGroups("chunks", {
    query: [0.2, 0.1, 0.9, 0.7],
    group_by: "document_id",
    limit: 2,
    group_size: 2,
    with_lookup: {
        collection: "documents",
        with_payload: ["title", "text"],
        with_vectors: false,
    },
});
