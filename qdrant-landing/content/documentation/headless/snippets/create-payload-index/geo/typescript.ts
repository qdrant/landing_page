import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.createPayloadIndex("{collection_name}", {
  field_name: "location",
  field_schema: "geo",
});
