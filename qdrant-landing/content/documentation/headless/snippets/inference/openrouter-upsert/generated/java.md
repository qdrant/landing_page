```java
import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.VectorsFactory.vectors;

import io.grpc.Context;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.RequestHeaders;
import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.PointStruct;
import java.util.List;

Context ctx = RequestHeaders.withHeader(
    Context.current(), "openrouter-api-key", "<YOUR_OPENROUTER_API_KEY>");

ctx.call(() -> client
    .upsertAsync(
        "{collection_name}",
        List.of(
            PointStruct.newBuilder()
                .setId(id(1))
                .setVectors(
                    vectors(
                        Document.newBuilder()
                            .setModel("openrouter/mistralai/mistral-embed-2312")
                            .setText("Recipe for baking chocolate chip cookies")
                            .build()))
                .build()))
    .get());
```
