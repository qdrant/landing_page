```java
import static io.qdrant.client.ConditionFactory.matchKeyword;
import static io.qdrant.client.WithPayloadSelectorFactory.enable;

import io.qdrant.client.grpc.Points.Filter;
import io.qdrant.client.grpc.Points.ScrollPoints;

client
    .scrollAsync(
        ScrollPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setFilter(Filter.newBuilder().addMust(matchKeyword("color", "red")).build())
            .setLimit(1)
            .setWithPayload(enable(true))
            .build())
    .get();
```
