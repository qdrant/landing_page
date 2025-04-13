```java
import static io.qdrant.client.ConditionFactory.matchKeyword;

import io.qdrant.client.grpc.Points.Filter;
import io.qdrant.client.grpc.Points.ScrollPoints;

client
    .scrollAsync(
        ScrollPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setFilter(
                Filter.newBuilder()
                    .addMust(matchKeyword("city", "London"))
                    .addMustNot(matchKeyword("color", "red"))
                    .build())
            .build())
    .get();
```
