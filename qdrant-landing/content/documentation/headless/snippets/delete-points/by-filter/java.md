```java
import static io.qdrant.client.ConditionFactory.matchKeyword;

import io.qdrant.client.grpc.Points.Filter;

client
    .deleteAsync(
        "{collection_name}",
        Filter.newBuilder().addMust(matchKeyword("color", "red")).build())
    .get();
```
