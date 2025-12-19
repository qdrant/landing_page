```java
import static io.qdrant.client.ConditionFactory.matchKeyword;

import io.qdrant.client.grpc.Common.Filter;

client
    .deleteAsync(
        "{collection_name}",
        Filter.newBuilder().addMust(matchKeyword("color", "red")).build())
    .get();
```
