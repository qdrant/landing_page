import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.updateCollection("{collection_name}", {
  params: {
    read_fan_out_delay_ms: 100,
  },
});
