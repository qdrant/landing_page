import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

const best_match = await client.query("{collection_name}", {
  prefetch: [
    { query: [0.1, 0.45, 0.67], using: "title", limit: 50 },
    { query: [0.1, 0.45, 0.67], using: "summary", limit: 50 }
  ],
  query: {
    formula: { max: ["$score[0]", "$score[1]"] }
  }
});
