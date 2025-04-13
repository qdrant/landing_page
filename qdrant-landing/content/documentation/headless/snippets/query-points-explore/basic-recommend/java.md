```java
import java.util.List;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.RecommendInput;
import io.qdrant.client.grpc.Points.RecommendStrategy;
import io.qdrant.client.grpc.Points.Filter;

import static io.qdrant.client.ConditionFactory.matchKeyword;
import static io.qdrant.client.VectorInputFactory.vectorInput;
import static io.qdrant.client.QueryFactory.recommend;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.queryAsync(QueryPoints.newBuilder()
        .setCollectionName("{collection_name}")
        .setQuery(recommend(RecommendInput.newBuilder()
                .addAllPositive(List.of(vectorInput(100), vectorInput(200), vectorInput(100.0f, 231.0f)))
                .addAllNegative(List.of(vectorInput(718), vectorInput(0.2f, 0.3f, 0.4f, 0.5f)))
                .setStrategy(RecommendStrategy.AverageVector)
                .build()))
        .setFilter(Filter.newBuilder().addMust(matchKeyword("city", "London")))
        .setLimit(3)
        .build()).get();
```
