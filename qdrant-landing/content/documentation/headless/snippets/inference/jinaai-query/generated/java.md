```java
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.ValueFactory.value;

import io.grpc.Context;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.RequestHeaders;
import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.QueryPoints;
import java.util.Map;

Context ctx = RequestHeaders.withHeader(
    Context.current(), "jina-api-key", "<YOUR_JINAAI_API_KEY>");

ctx.call(() -> client
    .queryAsync(
        QueryPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setQuery(
                nearest(
                    Document.newBuilder()
                        .setModel("jinaai/jina-clip-v2")
                        .setText("Mission to Mars")
                        .putAllOptions(
                            Map.of(
                                "dimensions",
                                value(512)))
                        .build()))
            .build())
    .get());
```
