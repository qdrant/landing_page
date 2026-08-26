import { QdrantClient } from "@qdrant/js-client-rest";

// @hide-start
const client = new QdrantClient({ host: "localhost", port: 6333 });
// @hide-end

client.createCollection("{collection_name}", {
  vectors: {
    size: 768,
    distance: "Cosine",
    memory: "cold",
    datatype: "turbo4",
  },
  quantization_config: {
    turbo: {
      memory: "cold",
      bits: "bits1",
    },
  },
  hnsw_config: {
    memory: "cold",
    inline_storage: true,
  },
});
