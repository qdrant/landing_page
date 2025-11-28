```java
import static io.qdrant.client.PointIdFactory.id;

import java.util.List;

client
    .deleteVectorsAsync(
        "{collection_name}", List.of("text", "image"), List.of(id(0), id(3), id(10)))
    .get();
```
