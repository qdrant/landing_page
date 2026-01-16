import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.query("books", {
  query: {
    text: "村上春樹",
    model: "qdrant/bm25",
    options: { tokenizer: "multilingual" },
  },
  using: "author-bm25",
  limit: 10,
  with_payload: true,
});
