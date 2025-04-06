```java
import static io.qdrant.client.ConditionFactory.valuesCount;

import io.qdrant.client.grpc.Points.ValuesCount;

valuesCount("comments", ValuesCount.newBuilder().setGt(2).build());
```
