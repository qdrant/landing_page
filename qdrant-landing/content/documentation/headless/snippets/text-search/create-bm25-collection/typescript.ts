import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.createCollection("books", {
  sparse_vectors: {
    "title-bm25": { modifier: "idf" },
  },
});
