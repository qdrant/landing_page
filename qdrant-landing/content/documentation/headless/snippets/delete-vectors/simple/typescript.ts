import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.deleteVectors("{collection_name}", {
  points: [0, 3, 10],
  vector: ["text", "image"],
});
