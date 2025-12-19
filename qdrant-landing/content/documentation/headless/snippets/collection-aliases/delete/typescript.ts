import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.updateCollectionAliases({
  actions: [
    {
      delete_alias: {
        alias_name: "production_collection",
      },
    },
  ],
});
