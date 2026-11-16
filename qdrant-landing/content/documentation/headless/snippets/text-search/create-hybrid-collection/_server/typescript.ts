import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

await client.createCollection("books", {
  vectors: {
    "description-dense": { size: 384, distance: "Cosine" },
  },
});

await client.createPayloadIndex("books", {
  field_name: "title",
  field_schema: {
    type: "text",
    scoring: true,
  },
});
