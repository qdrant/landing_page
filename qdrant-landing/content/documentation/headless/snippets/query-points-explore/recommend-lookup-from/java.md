```java
import java.util.List;

import io.qdrant.client.grpc.Points.LookupLocation;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.RecommendInput;

import static io.qdrant.client.VectorInputFactory.vectorInput;
import static io.qdrant.client.QueryFactory.recommend;

client.queryAsync(QueryPoints.newBuilder()
        .setCollectionName("{collection_name}")
        .setQuery(recommend(RecommendInput.newBuilder()
                .addAllPositive(List.of(vectorInput(100), vectorInput(231)))
                .addAllNegative(List.of(vectorInput(718)))
                .build()))
        .setUsing("image")
        .setLimit(10)
        .setLookupFrom(
                LookupLocation.newBuilder()
                        .setCollectionName("{external_collection_name}")
                        .setVectorName("{external_vector_name}")
                        .build())
        .build()).get();
```
