import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.createCollection("{collection_name}", {
  vectors: {
    dense_vector: { size: 384, distance: "Cosine" },
  },
  sparse_vectors: {
    bm25_sparse_vector: {
      modifier: "idf" // Enable Inverse Document Frequency
    }
  }
});
