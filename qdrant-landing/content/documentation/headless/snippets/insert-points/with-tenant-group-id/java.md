```java
import java.util.List;
import java.util.Map;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.PointStruct;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .upsertAsync(
        "{collection_name}",
        List.of(
            PointStruct.newBuilder()
                .setId(id(1))
                .setVectors(vectors(0.9f, 0.1f, 0.1f))
                .putAllPayload(Map.of("group_id", value("user_1")))
                .build(),
            PointStruct.newBuilder()
                .setId(id(2))
                .setVectors(vectors(0.1f, 0.9f, 0.1f))
                .putAllPayload(Map.of("group_id", value("user_1")))
                .build(),
            PointStruct.newBuilder()
                .setId(id(3))
                .setVectors(vectors(0.1f, 0.1f, 0.9f))
                .putAllPayload(Map.of("group_id", value("user_2")))
                .build()))
    .get();
```
