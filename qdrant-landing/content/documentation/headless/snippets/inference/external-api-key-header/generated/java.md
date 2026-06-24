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
        Context.current(), "openai-api-key", "<YOUR_OPENAI_API_KEY>");

    ctx.call(() -> client
        .upsertAsync(
            "{collection_name}",
            List.of(
                PointStruct.newBuilder()
                    .setId(id(1))
                    .setVectors(
                        vectors(
                            Document.newBuilder()
                                .setModel("openai/text-embedding-3-large")
                                .setText("Recipe for baking chocolate chip cookies")
                                .build()))
                    .build()))
        .get());
```
