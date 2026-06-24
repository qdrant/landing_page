```java
import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorsFactory.vectors;

import io.grpc.Context;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.RequestHeaders;
import io.qdrant.client.grpc.Points.Image;
import io.qdrant.client.grpc.Points.PointStruct;
import java.util.List;
import java.util.Map;

    Context ctx = RequestHeaders.withHeader(
        Context.current(), "cohere-api-key", "<YOUR_COHERE_API_KEY>");

    ctx.call(() -> client
        .upsertAsync(
            "{collection_name}",
            List.of(
                PointStruct.newBuilder()
                    .setId(id(1))
                    .setVectors(
                        vectors(
                            Image.newBuilder()
                                .setModel("cohere/embed-v4.0")
                                .setImage(
                                    value(
                                        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAAhKDveksOjmAAAAAElFTkSuQmCC"))
                                .putAllOptions(
                                    Map.of(
                                        "output_dimension",
                                        value(512)))
                                .build()))
                    .build()))
        .get());
```
