import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

const geodesic = await client.query("{collection_name}", {
  prefetch: {
    query: [-1.118, 0.3, 0.4], // the sign of the first element is flipped
    limit: 100
  },
  query: {
    formula: {
      neg: { acosh: { neg: "$score" } }
    }
  }
});
