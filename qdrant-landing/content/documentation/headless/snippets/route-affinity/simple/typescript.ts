import { QdrantClient, withHeaders } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

const result = await withHeaders({ "X-Qdrant-Route-Affinity": "user-42" }, () =>
    client.query("{collection_name}", {
        query: [0.2, 0.1, 0.9, 0.7],
        limit: 3,
    })
);
