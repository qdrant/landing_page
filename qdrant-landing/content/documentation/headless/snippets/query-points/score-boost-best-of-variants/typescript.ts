import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

const best_fields = await client.query("{collection_name}", {
  prefetch: [
    {
      query: { text: "vector database" },
      using: "title",
      limit: 50
    },
    {
      query: { text: "vector database" },
      using: "body",
      limit: 50
    }
  ],
  query: {
    formula: {
      max: [
        { mult: [3.0, "$score[0]"] }, // boost title matches
        "$score[1]"
      ]
    }
  }
});
