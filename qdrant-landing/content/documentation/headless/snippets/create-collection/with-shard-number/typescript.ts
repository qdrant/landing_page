import { QdrantClient } from "@qdrant/js-client-rest";

// @hide-start
const client = new QdrantClient({ host: "localhost", port: 6333 });
// @hide-end

client.createCollection("{collection_name}", {
    vectors: {
        size: 300,
        distance: "Cosine",
    },
    shard_number: 6,
});
