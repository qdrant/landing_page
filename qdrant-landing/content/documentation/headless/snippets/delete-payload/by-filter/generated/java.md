```java
import static io.qdrant.client.ConditionFactory.matchKeyword;

import io.qdrant.client.grpc.Common.Filter;
import java.util.List;

client
    .deletePayloadAsync(
        "{collection_name}",
        List.of("color", "price"),
        Filter.newBuilder().addMust(matchKeyword("color", "red")).build(),
        true,
        null,
        null)
    .get();
```
