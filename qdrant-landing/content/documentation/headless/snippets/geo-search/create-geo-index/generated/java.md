```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.PayloadSchemaType;

client
    .createPayloadIndexAsync("venues", "location", PayloadSchemaType.Geo, null, null, null, null)
    .get();
```
