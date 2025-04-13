```java
import java.util.List;

import static io.qdrant.client.ConditionFactory.hasVector;
import static io.qdrant.client.PointIdFactory.id;

import io.qdrant.client.grpc.Points.Filter;
import io.qdrant.client.grpc.Points.ScrollPoints;

client
    .scrollAsync(
        ScrollPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setFilter(
                Filter.newBuilder()
                    .addMust(hasVector("image"))
                    .build())
            .build())
    .get();
```
