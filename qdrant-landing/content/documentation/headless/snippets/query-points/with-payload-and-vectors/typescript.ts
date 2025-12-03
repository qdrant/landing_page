import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.query("{collection_name}", {
  query: [0.2, 0.1, 0.9, 0.7],
  with_vector: true,
  with_payload: true,
});
