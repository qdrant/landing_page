import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
  strict_mode_config: {
    enabled: true,
    sparse_config: {
      "{vector_name}": {
        max_length: 1000,
      },
    },
  },
});
