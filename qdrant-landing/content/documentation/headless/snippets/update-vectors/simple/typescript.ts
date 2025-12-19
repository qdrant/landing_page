import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.updateVectors("{collection_name}", {
  points: [
    {
      id: 1,
      vector: {
        image: [0.1, 0.2, 0.3, 0.4],
      },
    },
    {
      id: 2,
      vector: {
        text: [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2],
      },
    },
  ],
});
