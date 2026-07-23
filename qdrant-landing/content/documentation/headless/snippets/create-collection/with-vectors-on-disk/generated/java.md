```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.Memory;
import io.qdrant.client.grpc.Collections.VectorParams;

client
    .createCollectionAsync(
        "{collection_name}",
        VectorParams.newBuilder()
            .setSize(768)
            .setDistance(Distance.Cosine)
            .setMemory(Memory.Cold)
            .build())
    .get();
```
