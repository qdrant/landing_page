import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.scroll("{collection_name}", {
  filter: {
    must: [
      {
        nested: {
          key: "diet",
          filter: {
            must: [
              {
                key: "food",
                match: { value: "meat" },
              },
              {
                key: "likes",
                match: { value: true },
              },
            ],
          },
        },
      },
    ],
  },
});
