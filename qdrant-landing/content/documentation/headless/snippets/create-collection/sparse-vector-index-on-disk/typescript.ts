import { QdrantClient, Schemas } from "@qdrant/js-client-rest";

// @hide-start
const client = new QdrantClient({ host: "localhost", port: 6333 });
// @hide-end

client.createCollection("{collection_name}", {
  sparse_vectors: {
    "text": {
      index: {
        memory: "cold"
      }
    }
  }
});
