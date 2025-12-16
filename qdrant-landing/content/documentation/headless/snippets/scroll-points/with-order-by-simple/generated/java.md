```java
import io.qdrant.client.grpc.Points.OrderBy;
import io.qdrant.client.grpc.Points.ScrollPoints;

client.scrollAsync(ScrollPoints.newBuilder()
  .setCollectionName("{collection_name}")
  .setLimit(15)
  .setOrderBy(OrderBy.newBuilder().setKey("timestamp").build())
  .build()).get();
```
