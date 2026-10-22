import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

const capped_boost = await client.query("{collection_name}", {
  prefetch: {
    query: [0.1, 0.45, 0.67],
    limit: 50
  },
  query: {
    formula: {
      sum: [
        "$score",
        // the boost can't exceed 2.0
        { min: [2.0, { mult: [0.1, "log_views"] }] }
      ]
    }
  }
});
