```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.RequestHeaders;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.grpc.Context;

import static io.qdrant.client.QueryFactory.nearest;

Context ctx = RequestHeaders.withHeader(
    Context.current(), "X-Qdrant-Route-Affinity", "user-42");
ctx.run(() -> client.queryAsync(
    QueryPoints.newBuilder()
        .setCollectionName("{collection_name}")
        .setQuery(nearest(0.2f, 0.1f, 0.9f, 0.7f))
        .setLimit(3)
        .build()));
```
