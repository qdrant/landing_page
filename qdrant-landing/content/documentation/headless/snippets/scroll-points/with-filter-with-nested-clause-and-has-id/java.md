```java
import java.util.List;

import static io.qdrant.client.ConditionFactory.hasId;
import static io.qdrant.client.ConditionFactory.match;
import static io.qdrant.client.ConditionFactory.matchKeyword;
import static io.qdrant.client.ConditionFactory.nested;
import static io.qdrant.client.PointIdFactory.id;

import io.qdrant.client.grpc.Points.Filter;
import io.qdrant.client.grpc.Points.ScrollPoints;

client
    .scrollAsync(
        ScrollPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setFilter(
                Filter.newBuilder()
                    .addMust(
                        nested(
                            "diet",
                            Filter.newBuilder()
                                .addAllMust(
                                    List.of(
                                        matchKeyword("food", "meat"), match("likes", true)))
                                .build()))
                    .addMust(hasId(id(1)))
                    .build())
            .build())
    .get();
```
