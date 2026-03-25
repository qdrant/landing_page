import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.query("books", {
  query: {
    text: "time travel",
    model: "sentence-transformers/all-minilm-l6-v2",
  },
  using: "description-dense",
  with_payload: true,
  filter: {
    must_not: [
      { key: "author", match: { value: "H.G. Wells" } },
    ],
  },
});
