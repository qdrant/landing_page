import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.updateCollectionCluster("{collection_name}", {
    replicate_points: {
        filter: {
            must: {
                key: "group_id",
                match: {
                    value: "user_1"
                }
            }
        },
        from_shard_key: "default",
        to_shard_key: "user_1"
    }
});
