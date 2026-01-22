import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.queryBatch("books", {
  searches: [
    {
      query: { text: "time travel", model: "sentence-transformers/all-minilm-l6-v2" },
      using: "description-dense",
      with_payload: true,
      filter: {
        must: [{ key: "title", match: { text: "time travel" } }],
      },
    },
    {
      query: { text: "time travel", model: "sentence-transformers/all-minilm-l6-v2" },
      using: "description-dense",
      with_payload: true,
      filter: {
        must: [{ key: "title", match: { text_any: "time travel" } }],
      },
    },
    {
      query: { text: "time travel", model: "sentence-transformers/all-minilm-l6-v2" },
      using: "description-dense",
      with_payload: true,
    },
  ],
});
