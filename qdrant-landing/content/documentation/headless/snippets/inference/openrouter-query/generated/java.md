```java
import static io.qdrant.client.QueryFactory.nearest;

import io.grpc.Context;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.RequestHeaders;
import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.QueryPoints;

Context ctx = RequestHeaders.withHeader(
    Context.current(), "openrouter-api-key", "<YOUR_OPENROUTER_API_KEY>");

ctx.call(() -> client
    .queryAsync(
        QueryPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setQuery(
                nearest(
                    Document.newBuilder()
                        .setModel("openrouter/mistralai/mistral-embed-2312")
                        .setText("How to bake cookies?")
                        .build()))
            .build())
    .get());
```
