```java
import java.util.List;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Filter;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.RecommendInput;

import static io.qdrant.client.ConditionFactory.matchKeyword;
import static io.qdrant.client.VectorInputFactory.vectorInput;
import static io.qdrant.client.QueryFactory.recommend;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

Filter filter = Filter.newBuilder().addMust(matchKeyword("city", "London")).build();

List<QueryPoints> recommendQueries = List.of(
        QueryPoints.newBuilder()
                .setCollectionName("{collection_name}")
                .setQuery(recommend(
                        RecommendInput.newBuilder()
                                .addAllPositive(List.of(vectorInput(100), vectorInput(231)))
                                .addAllNegative(List.of(vectorInput(731)))
                                .build()))
                .setFilter(filter)
                .setLimit(3)
                .build(),
        QueryPoints.newBuilder()
                .setCollectionName("{collection_name}")
                .setQuery(recommend(
                        RecommendInput.newBuilder()
                                .addAllPositive(List.of(vectorInput(200), vectorInput(67)))
                                .addAllNegative(List.of(vectorInput(300)))
                                .build()))
                .setFilter(filter)
                .setLimit(3)
                .build());
                
client.queryBatchAsync("{collection_name}", recommendQueries).get();
```
