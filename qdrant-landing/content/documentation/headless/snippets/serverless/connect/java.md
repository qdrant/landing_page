```java
import io.qdrant.client.QdrantServerlessClient;

QdrantServerlessClient client =
    new QdrantServerlessClient(
        QdrantServerlessClient.newGrpcClientBuilder("serverless.<region>.cloud.qdrant.io")
            .withApiKey("<your-api-key>")
            .build());
```
