```java
import java.util.List;
import java.util.Map;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;

client
    .setPayloadAsync(
        "{collection_name}",
        Map.of("property1", value("string"), "property2", value("string")),
        List.of(id(0), id(3), id(10)),
        true,
        null,
        null)
    .get();
```
