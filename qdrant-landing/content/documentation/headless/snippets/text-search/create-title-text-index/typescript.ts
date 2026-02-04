import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.createPayloadIndex("books", {
  field_name: "title",
  field_schema: {
    type: "text",
    ascii_folding: true,
  },
});
