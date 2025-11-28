```java
import io.qdrant.client.grpc.Points.Direction;
import io.qdrant.client.grpc.Points.OrderBy;
import io.qdrant.client.grpc.Points.StartFrom;

OrderBy.newBuilder()
  .setKey("timestamp")
  .setDirection(Direction.Desc)
  .setStartFrom(StartFrom.newBuilder()
    .setInteger(123)
    .build())
  .build();
```
