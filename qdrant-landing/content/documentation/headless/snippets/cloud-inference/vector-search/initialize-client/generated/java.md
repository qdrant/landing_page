```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;

QdrantClient client =
      new QdrantClient(
        QdrantGrpcClient.newBuilder("xyz-example.cloud-region.cloud-provider.cloud.qdrant.io", 6334, true)
        .withApiKey("<paste-your-api-key-here>")
        .build());
```
