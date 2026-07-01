import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.updateCollection("{collection_name}", {
  hnsw_config: {
    max_indexing_threads: 4,
  },
});
