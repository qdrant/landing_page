```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;
import java.util.Map;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync(
        "{collection_name}",
        Map.of(
            "image", VectorParams.newBuilder().setSize(4).setDistance(Distance.Dot).build(),
            "text",
                VectorParams.newBuilder().setSize(8).setDistance(Distance.Cosine).build()))
    .get();
```
