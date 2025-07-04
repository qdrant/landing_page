```java
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.QueryFactory.mmr;

import java.util.List;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.MmrQuery;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.QueryPoints;

QdrantClient client = new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.queryAsync(
    QueryPoints.newBuilder()
    .setCollectionName("{collection_name}")
    .addPrefetch(PrefetchQuery.newBuilder()
      .setQuery(nearest(List.of(0.01f, 0.45f, 0.67f))) // <-- search vector
      .setLimit(100)
      .build())
    .setQuery(mmr(
        // same vector
        List.of(0.01f, 0.45f, 0.67f),
        0.5f))
    .build())
  .get();
```
