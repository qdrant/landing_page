import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.query("books", {
  prefetch: [
    {
      query: { text: "time travel", model: "sentence-transformers/all-minilm-l6-v2" },
      using: "description-dense",
      score_threshold: 0.5,
    },
    {
      query: { text: "time travel" },
      using: "title",
    },
  ],
  query: { fusion: "rrf" },
  limit: 10,
  with_payload: true,
});
