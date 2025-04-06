```java
import java.util.List;

import static io.qdrant.client.ConditionFactory.hasId;
import static io.qdrant.client.PointIdFactory.id;

import io.qdrant.client.grpc.Points.Filter;
import io.qdrant.client.grpc.Points.ScrollPoints;

client
    .scrollAsync(
        ScrollPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setFilter(
                Filter.newBuilder()
                    .addMust(hasId(List.of(id(1), id(3), id(5), id(7), id(9), id(11))))
                    .build())
            .build())
    .get();
```
