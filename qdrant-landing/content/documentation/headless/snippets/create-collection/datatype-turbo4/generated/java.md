```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.Datatype;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;

client
    .createCollectionAsync("{collection_name}",
        VectorParams.newBuilder()
            .setSize(1024)
            .setDistance(Distance.Cosine)
            .setDatatype(Datatype.Turbo4)
            .build())
    .get();
```
