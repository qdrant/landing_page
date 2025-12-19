```java
import static io.qdrant.client.PointIdFactory.id;

import java.util.List;

client
    .clearPayloadAsync("{collection_name}", List.of(id(0), id(3), id(100)), true, null, null)
    .get();
```
