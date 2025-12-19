```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.PayloadSchemaType;
import io.qdrant.client.grpc.Collections.PayloadIndexParams;

client.createPayloadIndexAsync(
    "books",
    "author",
    PayloadSchemaType.Keyword,
    null,
    null,
    null,
    null
).get();
```
