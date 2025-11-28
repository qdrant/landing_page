import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.upsert("{collection_name}", {
  points: [
    {
      id: 1,
      vector: {
        image: [0.9, 0.1, 0.1, 0.2],
        text: [0.4, 0.7, 0.1, 0.8, 0.1, 0.1, 0.9, 0.2],
      },
    },
    {
      id: 2,
      vector: {
        image: [0.2, 0.1, 0.3, 0.9],
        text: [0.5, 0.2, 0.7, 0.4, 0.7, 0.2, 0.3, 0.9],
      },
    },
  ],
});
