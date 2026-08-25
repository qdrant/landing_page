import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createShardKey("{collection_name}", {
    shard_key: "default",
    shards_number: 1,
    replication_factor: 1,
    initial_state: "Partial"
});
