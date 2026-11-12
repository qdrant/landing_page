import { QdrantClient } from "@qdrant/js-client-rest";

// @hide-start
const client = new QdrantClient({ host: "localhost", port: 6333 });
// @hide-end

await client.createPayloadIndex("{collection_name}", {
  field_name: "offers[].shop",
  field_schema: {
    type: "keyword",
    nested: "offers",
  },
});

await client.createPayloadIndex("{collection_name}", {
  field_name: "offers[].price",
  field_schema: {
    type: "float",
    nested: "offers",
  },
});
