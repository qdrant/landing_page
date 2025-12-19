import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.upsert("{collection_name}", {
  points: [
    {
      id: 1,
      payload: {
        color: "red",
      },
      vector: [0.9, 0.1, 0.1],
    },
  ],
});
