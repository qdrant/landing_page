import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.query("books", {
  query: {
    text: "Mieville",
    model: "qdrant/bm25",
    options: { ascii_folding: true },
  },
  using: "author-bm25",
  limit: 10,
  with_payload: true,
});
