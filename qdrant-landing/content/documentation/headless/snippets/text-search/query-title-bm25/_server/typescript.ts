import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.query("books", {
  query: {
    text: "time travel",
  },
  using: "title",
  limit: 10,
  with_payload: true,
});
