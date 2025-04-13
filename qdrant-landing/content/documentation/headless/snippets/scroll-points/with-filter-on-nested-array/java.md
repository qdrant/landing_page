```java
import static io.qdrant.client.ConditionFactory.range;

import io.qdrant.client.grpc.Points.Filter;
import io.qdrant.client.grpc.Points.Range;
import io.qdrant.client.grpc.Points.ScrollPoints;

client
    .scrollAsync(
        ScrollPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setFilter(
                Filter.newBuilder()
                    .addShould(
                        range(
                            "country.cities[].population",
                            Range.newBuilder().setGte(9.0).build()))
                    .build())
            .build())
    .get();
```
