import { QdrantClient, withHeaders } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

const result = await withHeaders({ "x-request-id": "my-trace-id" }, () =>
    client.getCollections()
);
