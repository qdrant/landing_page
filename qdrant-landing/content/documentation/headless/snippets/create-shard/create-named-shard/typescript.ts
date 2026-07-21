import { QdrantClient } from "@qdrant/js-client-rest";

// @hide-start
const client = new QdrantClient({ host: "localhost", port: 6333 });
// @hide-end

client.createShardKey("{collection_name}", {
    shard_key: "{shard_key}"
});
