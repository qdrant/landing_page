```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.grpc.Collections.Datatype;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;

QdrantClient client = new QdrantClient(
    QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync("{collection_name}",
        VectorParams.newBuilder()
            .setSize(1024)
            .setDistance(Distance.Cosine)
            .setDatatype(Datatype.Uint8)
            .build())
    .get();
```
