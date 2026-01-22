import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.query("books", {
  query: {
    text: "time travel",
    model: "prithivida/splade_pp_en_v1",
  },
  using: "title-splade",
  limit: 10,
  with_payload: true,
});
