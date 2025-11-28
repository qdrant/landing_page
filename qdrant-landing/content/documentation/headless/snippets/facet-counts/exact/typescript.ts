import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.facet("{collection_name}", {
    key: "size",
    exact: true,
});
