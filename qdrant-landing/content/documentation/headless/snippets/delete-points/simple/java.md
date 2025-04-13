```java
import java.util.List;

import static io.qdrant.client.PointIdFactory.id;

client.deleteAsync("{collection_name}", List.of(id(0), id(3), id(100)));
```
