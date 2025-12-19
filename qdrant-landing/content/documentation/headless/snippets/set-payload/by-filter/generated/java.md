```java
import static io.qdrant.client.ConditionFactory.matchKeyword;
import static io.qdrant.client.ValueFactory.value;

import io.qdrant.client.grpc.Common.Filter;
import java.util.Map;

client
    .setPayloadAsync(
        "{collection_name}",
        Map.of("property1", value("string"), "property2", value("string")),
        Filter.newBuilder().addMust(matchKeyword("color", "red")).build(),
        true,
        null,
        null)
    .get();
```
