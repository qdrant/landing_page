```java
import static io.qdrant.client.ConditionFactory.matchKeyword;

import io.qdrant.client.grpc.Points.Filter;
import io.qdrant.client.grpc.Points.ScrollPoints;
import java.util.List;

client
    .scrollAsync(
        ScrollPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setFilter(
                Filter.newBuilder()
                    .addAllShould(
                        List.of(matchKeyword("city", "London"), matchKeyword("color", "red")))
                    .build())
            .build())
    .get();
```
