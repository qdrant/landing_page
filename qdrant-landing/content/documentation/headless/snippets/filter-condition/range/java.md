```java
import static io.qdrant.client.ConditionFactory.range;

import io.qdrant.client.grpc.Points.Range;

range("price", Range.newBuilder().setGte(100.0).setLte(450).build());
```
