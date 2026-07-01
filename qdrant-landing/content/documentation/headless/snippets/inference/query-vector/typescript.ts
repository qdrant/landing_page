import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.query("{collection_name}", {
    query: [0.12, 0.34, 0.56, 0.78],
});
