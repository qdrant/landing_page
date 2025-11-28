```java
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.QueryPoints;
import java.util.List;

QdrantClient client = new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.queryAsync(QueryPoints.newBuilder()
  .setCollectionName("{collectionName}")
  .setQuery(nearest(List.of(0.2f, 0.1f, 0.9f, 0.7f)))
  .build()).get();
```
