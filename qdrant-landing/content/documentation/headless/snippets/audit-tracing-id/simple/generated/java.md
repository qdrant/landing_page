```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.RequestHeaders;
import io.grpc.Context;

Context ctx = RequestHeaders.withHeader(Context.current(), "x-request-id", "my-trace-id");
ctx.run(() -> client.listCollectionsAsync());
```
