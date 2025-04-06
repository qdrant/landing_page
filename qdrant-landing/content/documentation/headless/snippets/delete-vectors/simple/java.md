```java
import java.util.List;

import static io.qdrant.client.PointIdFactory.id;

client
    .deleteVectorsAsync(
        "{collection_name}", List.of("text", "image"), List.of(id(0), id(3), id(10)))
    .get();
```
