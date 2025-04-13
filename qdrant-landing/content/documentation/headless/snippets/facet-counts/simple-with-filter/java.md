```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;

import static io.qdrant.client.ConditionFactory.matchKeyword;
import io.qdrant.client.grpc.Points;
import io.qdrant.client.grpc.Filter;

QdrantClient client = new QdrantClient(
                QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .facetAsync(
        Points.FacetCounts.newBuilder()
            .setCollectionName(collection_name)
            .setKey("size")
            .setFilter(Filter.newBuilder().addMust(matchKeyword("color", "red")).build())
            .build())
        .get();
```
