import { QdrantClient } from "@qdrant/js-client-rest";

// @hide-start
const client = new QdrantClient({ host: "localhost", port: 6333 });
// @hide-end

client.createPayloadIndex("{collection_name}", {
  field_name: "payload_field_name",
  field_schema: {
    type: "keyword",
    memory: "cold"
  },
});
