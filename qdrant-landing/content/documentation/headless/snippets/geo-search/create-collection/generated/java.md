```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;

client.createCollectionAsync("venues",
        VectorParams.newBuilder().setDistance(Distance.Cosine).setSize(384).build()).get();
```
