import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

// @block-start get-current-value
const collectionInfo = await client.getCollection("{collection_name}");
const baseEf = collectionInfo.config.hnsw_config.ef_construct;
// @block-end get-current-value

// @block-start update-collection
await client.updateCollection("{collection_name}", {
  hnsw_config: {
    ef_construct: baseEf + 1,
  },
});
// @block-end update-collection
