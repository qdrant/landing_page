import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.scroll("{collection_name}", {
  filter: {
    must: [
      {
        key: "color",
        match: {
          value: "red",
        },
      },
    ],
  },
  limit: 1,
  with_payload: true,
  with_vector: false,
});
