import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.updateCollection("{collection_name}", {
  optimizers_config: {
    default_segment_number: 4,
    max_segment_size: 1000000,
  },
});
