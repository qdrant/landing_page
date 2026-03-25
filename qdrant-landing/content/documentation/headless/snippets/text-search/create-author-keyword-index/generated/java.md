```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.PayloadSchemaType;

QdrantClient client =

client
    .createPayloadIndexAsync(
        "books", "author", PayloadSchemaType.Keyword, null, null, null, null)
    .get();
```
