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
        Context.current(), "cohere-api-key", "<YOUR_COHERE_API_KEY>");

    ctx.call(() -> client
        .queryAsync(
            QueryPoints.newBuilder()
                .setCollectionName("{collection_name}")
                .setQuery(
                    nearest(
                        Document.newBuilder()
                            .setModel("cohere/embed-v4.0")
                            .setText("a green square")
                            .putAllOptions(
                                Map.of(
                                    "output_dimension",
                                    value(512)))
                            .build()))
                .build())
        .get());
```
