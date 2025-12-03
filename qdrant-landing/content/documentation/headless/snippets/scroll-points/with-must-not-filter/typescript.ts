import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.scroll("{collection_name}", {
  filter: {
    must_not: [
      {
        key: "city",
        match: { value: "London" },
      },
      {
        key: "color",
        match: { value: "red" },
      },
    ],
  },
});
