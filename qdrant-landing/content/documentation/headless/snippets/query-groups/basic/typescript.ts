import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.queryGroups("{collection_name}", {
    query: [1.1],
    group_by: "document_id",
    limit: 4,
    group_size: 2,
});
