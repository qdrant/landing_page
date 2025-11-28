```java
import static io.qdrant.client.ConditionFactory.matchKeyword;

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
