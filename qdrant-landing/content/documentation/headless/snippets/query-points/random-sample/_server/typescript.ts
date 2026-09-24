import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

const sampled = await client.query("{collection_name}", {
  query: {
    sample: "random",
  },
});
