```java
import static io.qdrant.client.ConditionFactory.filter;
import static io.qdrant.client.ConditionFactory.matchKeyword;

import io.qdrant.client.grpc.Common.Filter;
import io.qdrant.client.grpc.Points.ScrollPoints;
import java.util.List;

client
    .scrollAsync(
        ScrollPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setFilter(
                Filter.newBuilder()
                    .addMustNot(
                        filter(
                            Filter.newBuilder()
                                .addAllMust(
                                    List.of(
                                        matchKeyword("city", "London"),
                                        matchKeyword("color", "red")))
                                .build()))
                    .build())
            .build())
    .get();
```
