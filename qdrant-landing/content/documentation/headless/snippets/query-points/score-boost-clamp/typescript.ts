import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

const clamped = await client.query("{collection_name}", {
  prefetch: {
    query: [0.1, 0.45, 0.67],
    limit: 50
  },
  query: {
    formula: {
      sum: [
        "$score",
        // clamp `rating` into the range [0, 1]
        { max: [0.0, { min: [1.0, "rating"] }] }
      ]
    }
  }
});
