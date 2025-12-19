import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.query("books", {
  query: {
    text: "space opera",
    model: "sentence-transformers/all-minilm-l6-v2",
  },
  using: "description-dense",
  with_payload: true,
  filter: {
    should: [
      { key: "author", match: { value: "Larry Niven" } },
      { key: "author", match: { value: "Jerry Pournelle" } },
    ],
  },
});
