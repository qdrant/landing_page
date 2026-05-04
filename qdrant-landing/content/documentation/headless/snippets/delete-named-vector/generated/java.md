```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.DeleteVectorNameRequest;

client
    .deleteVectorNameAsync(
        DeleteVectorNameRequest.newBuilder()
            .setCollectionName("{collection_name}")
            .setVectorName("{vector_name}")
            .build())
    .get();
```
