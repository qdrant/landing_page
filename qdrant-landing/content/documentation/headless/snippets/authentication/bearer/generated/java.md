```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import java.util.Map;

QdrantClient client = new QdrantClient(
    QdrantGrpcClient.newBuilder("xyz-example.eu-central.aws.cloud.qdrant.io", 6334, true)
        .withHeaders(Map.of("authorization", "Bearer your_token_here"))
        .build());
```
