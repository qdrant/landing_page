```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync(
        "{collection_name}",
        VectorParams.newBuilder()
            .setSize(768)
            .setDistance(Distance.Cosine)
            .setOnDisk(true)
            .build())
    .get();
```
