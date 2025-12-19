import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

client.createCollection("{collection_name}", {
    shard_number: 1,
    sharding_method: "custom",
    // ... other collection parameters
});
