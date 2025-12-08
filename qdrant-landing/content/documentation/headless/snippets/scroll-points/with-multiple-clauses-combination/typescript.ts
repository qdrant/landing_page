import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.scroll("{collection_name}", {
  filter: {
    must: [
      {
        key: "city",
        match: { value: "London" },
      },
    ],
    must_not: [
      {
        key: "color",
        match: { value: "red" },
      },
    ],
  },
});
