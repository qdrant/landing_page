import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.upsert("{collection_name}", {
  points: [
    {
      id: 1,
      vector: [0.05, 0.61, 0.76, 0.74],
      payload: {
        city: "Berlin",
        price: 1.99,
        version: 3
      },
    }
  ],
  update_filter: {
    must: [
      {
        key: "version",
        match: {
          value: 2
        }
      }
    ]
  }
});
