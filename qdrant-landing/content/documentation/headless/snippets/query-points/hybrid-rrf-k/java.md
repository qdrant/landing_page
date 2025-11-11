```java
import static io.qdrant.client.QueryFactory.nearest;

import java.util.List;

import static io.qdrant.client.QueryFactory.rrf;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Rrf;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.QueryPoints;

QdrantClient client = new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.queryAsync(
    QueryPoints.newBuilder()
    .setCollectionName("{collection_name}")
    // .addPrefetch(...) <┐
    // .addPrefetch(...) <┴─ 2+ prefetches here
    .setQuery(Rrf(Rrf.newBuilder().k(60).build())) <-- TODO
    .build())
  .get();
```
