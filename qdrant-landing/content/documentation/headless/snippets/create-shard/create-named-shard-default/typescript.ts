import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.createShardKey("{collection_name}", {
    shard_key: "default",
    shards_number: 1
});
