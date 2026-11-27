```java
import io.qdrant.client.grpc.serverless.ServerlessCollections.DenseVectorConfig;
import io.qdrant.client.grpc.serverless.ServerlessCollections.Distance;

String tenantId = "acme";

client
    .createCollectionAsync(
        "tenant-" + tenantId,
        DenseVectorConfig.newBuilder().setSize(384).setDistance(Distance.COSINE).build())
    .get();
```
