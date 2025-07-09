```java
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.QueryFactory.mmr;

import java.util.List;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Mmr;
import io.qdrant.client.grpc.Points.QueryPoints;

QdrantClient client = new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.queryAsync(
    QueryPoints.newBuilder()
    .setCollectionName("{collection_name}")
      .setQuery(nearest_with_mmr(
          List.of(0.01f, 0.45f, 0.67f), // <-- search vector
          Mmr.newBuilder()
              .setDiversity(0.5f) // 0.0 - relevance; 1.0 - diversity
              .setCandidateLimit(100))) // num of candidates to preselect
      .setLimit(10)
      .build())
  .get();
```
