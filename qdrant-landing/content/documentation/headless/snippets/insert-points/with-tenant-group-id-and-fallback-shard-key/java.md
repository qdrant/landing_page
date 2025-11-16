```java
import java.util.List;
import java.util.Map;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.PointStruct;

import io.qdrant.client.ShardKeyFactory.shardKey;
import io.qdrant.client.grpc.Points.ShardKeySelector;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

ShardKeySelector.Builder shardkeySelectorBuilder = ShardKeySelector.newBuilder();
shardkeySelectorBuilder.addShardKeys(shardKey("user_1"));
shardkeySelectorBuilder.setFallback(shardKey("default"));
ShardKeySelector shardKeySelector = shardkeySelectorBuilder.build();

client
    .upsertAsync(
        UpsertPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .addAllPoints(
                List.of(
                    PointStruct.newBuilder()
                        .setId(id(1))
                        .setVectors(vectors(0.9f, 0.1f, 0.1f))
                        .putAllPayload(Map.of("group_id", value("user_1")))
                        .build()
                )
            )
            .setShardKeySelector(shardKeySelector)
            .build()
    )
    .get();
```
