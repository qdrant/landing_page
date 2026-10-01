import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.scroll("{collection_name}", {
  filter: {
    should: [
      {
        key: "country.cities[].sightseeing",
        match: { value: "Osaka Castle" },
      },
    ],
  },
});
