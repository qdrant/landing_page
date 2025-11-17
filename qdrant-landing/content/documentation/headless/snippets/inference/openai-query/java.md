```java
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.ValueFactory.value;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.Document;
import java.util.Map;

QdrantClient client =
    new QdrantClient(
        QdrantGrpcClient.newBuilder("xyz-example.qdrant.io", 6334, true)
            .withApiKey("<your-api-key")
            .build());
client
    .queryAsync(
        Points.QueryPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setQuery(
                nearest(
                    Document.newBuilder()
                        .setModel("openai/text-embedding-3-large")
                        .setText("How to bake cookies?")
                        .putAllOptions(
                            Map.of(
                                "openai-api-key",
                                value("<YOUR_OPENAI_API_KEY>"),
                                "dimensions",
                                value(512)))
                        .build()))
            .build())
    .get();
```