import { QdrantClient } from "@qdrant/js-client-rest";

// @hide-start
const client = new QdrantClient({ host: "localhost", port: 6333 });
// @hide-end

client.createCollection("{collection_name}", {
  vectors: {
    size: 1536,
    distance: "Cosine",
  },
  quantization_config: {
    turbo: {
      always_ram: true,
      bits: "bits2",
    },
  },
});
