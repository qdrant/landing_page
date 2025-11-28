import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.deletePayload("{collection_name}", {
  keys: ["color", "price"],
  points: [0, 3, 100],
});
