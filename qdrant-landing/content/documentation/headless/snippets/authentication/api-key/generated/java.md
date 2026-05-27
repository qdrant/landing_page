```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;

QdrantClient client = new QdrantClient(
    QdrantGrpcClient.newBuilder("xyz-example.eu-central.aws.cloud.qdrant.io", 6334, true)
        .withApiKey("your_api_key_here")
        .build());
```
