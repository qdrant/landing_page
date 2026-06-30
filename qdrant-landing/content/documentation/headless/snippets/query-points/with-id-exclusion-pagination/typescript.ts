import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

const seenIds = [83461, 19284, 57392, 44017, 91825]; // IDs returned on previous pages

client.query("{collection_name}", {
  query: [0.2, 0.1, 0.9, 0.7],
  filter: {
    must_not: [
      {
        has_id: seenIds,
      },
    ],
  },
  limit: 5,
});
