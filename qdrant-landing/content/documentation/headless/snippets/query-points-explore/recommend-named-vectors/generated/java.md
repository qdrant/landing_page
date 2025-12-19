```java
import static io.qdrant.client.QueryFactory.recommend;
import static io.qdrant.client.VectorInputFactory.vectorInput;

import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.RecommendInput;
import java.util.List;

client.queryAsync(QueryPoints.newBuilder()
        .setCollectionName("{collection_name}")
        .setQuery(recommend(RecommendInput.newBuilder()
                .addAllPositive(List.of(vectorInput(100), vectorInput(231)))
                .addAllNegative(List.of(vectorInput(718)))
                .build()))
        .setUsing("image")
        .setLimit(10)
        .build()).get();
```
