```java
import java.util.List;

import static io.qdrant.client.PointIdFactory.id;

client
    .retrieveAsync("{collection_name}", List.of(id(0), id(30), id(100)), false, false, null)
    .get();
```
