import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.createVectorName("{collection_name}", "{vector_name}", {
  sparse: {
    modifier: "idf",
  },
});
