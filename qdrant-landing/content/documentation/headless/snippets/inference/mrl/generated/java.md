```java
import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorFactory.vector;
import static io.qdrant.client.VectorsFactory.namedVectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.PointStruct;
import java.util.List;
import java.util.Map;

QdrantClient client =
    new QdrantClient(
        QdrantGrpcClient.newBuilder("xyz-example.qdrant.io", 6334, true)
            .withApiKey("<your-api-key")
            .build());

client
    .upsertAsync(
        "{collection_name}",
        List.of(
            PointStruct.newBuilder()
                .setId(id(1))
                .setVectors(
                    namedVectors(
                        Map.of(
                            "large",
                            vector(
                                Document.newBuilder()
                                    .setModel("openai/text-embedding-3-small")
                                    .setText("Recipe for baking chocolate chip cookies")
                                    .putAllOptions(
                                        Map.of(
                                            "openai-api-key", value("<YOUR_OPENAI_API_KEY>")))
                                    .build()),
                            "small",
                            vector(
                                Document.newBuilder()
                                    .setModel("openai/text-embedding-3-small")
                                    .setText("Recipe for baking chocolate chip cookies")
                                    .putAllOptions(
                                        Map.of(
                                            "openai-api-key",
                                            value("<YOUR_OPENAI_API_KEY>"),
                                            "mrl",
                                            value(64)))
                                    .build()))))
                .build()))
    .get();
```
