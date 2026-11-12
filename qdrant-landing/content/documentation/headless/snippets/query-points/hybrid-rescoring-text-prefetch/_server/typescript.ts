import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.query("{collection_name}", {
    prefetch: {
        query: { text: "time travel" },
        using: "title",
        limit: 100,
    },
    query: [0.01, 0.45, 0.67], // <-- dense vector
    using: "dense",
    limit: 10,
});
