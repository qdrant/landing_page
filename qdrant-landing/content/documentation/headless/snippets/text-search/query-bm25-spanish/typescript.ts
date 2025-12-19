import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.query("books", {
  query: {
    text: "tiempo",
    model: "qdrant/bm25",
    options: { language: "spanish" },
  },
  using: "title-bm25",
  limit: 10,
  with_payload: true,
});
