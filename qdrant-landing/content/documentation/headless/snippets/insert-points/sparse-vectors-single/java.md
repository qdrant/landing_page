```java
import java.util.List;
import java.util.Map;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.VectorFactory.vector;
import static io.qdrant.client.VectorsFactory.namedVectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.PointStruct;

QdrantClient client =
  new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
  .upsertAsync(
    "{collection_name}",
    List.of(
      PointStruct.newBuilder()
      .setId(id(1))
      .setVectors(
        namedVectors(Map.of(
          "text", vector(List.of(1.0f, 2.0f), List.of(6, 7))))
      )
      .build()))
  .get();
```
