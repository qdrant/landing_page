```java
import static io.qdrant.client.ConditionFactory.matchKeyword;
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.QueryFactory.orderBy;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Filter;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.QueryPoints;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .queryAsync(
        QueryPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .addPrefetch(
                PrefetchQuery.newBuilder()
                    .setQuery(nearest(0.01f, 0.45f, 0.67f))
                    .setFilter(
                        Filter.newBuilder().addMust(matchKeyword("color", "red")).build())
                    .setLimit(10)
                    .build())
            .addPrefetch(
                PrefetchQuery.newBuilder()
                    .setQuery(nearest(0.01f, 0.45f, 0.67f))
                    .setFilter(
                        Filter.newBuilder().addMust(matchKeyword("color", "green")).build())
                    .setLimit(10)
                    .build())
            .setQuery(orderBy("price"))
            .build())
    .get();
```
