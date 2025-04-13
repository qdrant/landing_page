```java
import java.util.List;

import static io.qdrant.client.ConditionFactory.matchKeyword;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Filter;
import io.qdrant.client.grpc.Points.ScrollPoints;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .scrollAsync(
        ScrollPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setFilter(
                Filter.newBuilder()
                    .addAllMust(
                        List.of(matchKeyword("city", "London"), matchKeyword("color", "red")))
                    .build())
            .build())
    .get();
```
