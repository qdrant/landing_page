import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.scroll("{collection_name}", {
  filter: {
    should: [
      {
        key: "country.cities[].population",
        range: {
          gt: null,
          gte: 9.0,
          lt: null,
          lte: null,
        },
      },
    ],
  },
});
