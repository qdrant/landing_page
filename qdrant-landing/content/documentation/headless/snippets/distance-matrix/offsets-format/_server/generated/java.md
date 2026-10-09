```java
import static io.qdrant.client.ConditionFactory.matchKeyword;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Common.Filter;
import io.qdrant.client.grpc.Points.SearchMatrixPoints;

client
    .searchMatrixOffsetsAsync(
        SearchMatrixPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setFilter(Filter.newBuilder().addMust(matchKeyword("color", "red")).build())
            .setSample(10)
            .setLimit(2)
            .build())
    .get();
```
