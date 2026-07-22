import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.query("books", {
  query: {
    text: "time travel",
    model: "qdrant/bm25",
  },
  using: "title-bm25",
  filter: {
    must: [
      { key: "tenant", match: { value: "acme" } },
      { key: "year", match: { value: 2024 } },
    ],
  },
  params: {
    idf: {
      corpus: {
        must: [{ key: "tenant", match: { value: "acme" } }],
      },
    },
  },
  limit: 10,
});
