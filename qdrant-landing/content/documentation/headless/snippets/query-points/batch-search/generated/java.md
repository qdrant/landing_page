```java
import static io.qdrant.client.ConditionFactory.matchKeyword;
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Common.Filter;
import io.qdrant.client.grpc.Points.QueryPoints;
import java.util.List;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

Filter filter = Filter.newBuilder().addMust(matchKeyword("city", "London")).build();

List<QueryPoints> searches = List.of(
        QueryPoints.newBuilder()
                .setQuery(nearest(0.2f, 0.1f, 0.9f, 0.7f))
                .setFilter(filter)
                .setLimit(3)
                .build(),
        QueryPoints.newBuilder()
                .setQuery(nearest(0.2f, 0.1f, 0.9f, 0.7f))
                .setFilter(filter)
                .setLimit(3)
                .build());

client.queryBatchAsync("{collection_name}", searches).get();
```
