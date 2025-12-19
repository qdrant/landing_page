import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.scroll("{collection_name}", {
  filter: {
    must: [
      {
        key: "diet[].food",
        match: { value: "meat" },
      },
      {
        key: "diet[].likes",
        match: { value: true },
      },
    ],
  },
});
