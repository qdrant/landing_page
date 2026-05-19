```java
import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorsFactory.namedVectors;
import static io.qdrant.client.VectorsFactory.vectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.PointStruct;
import java.util.List;
import java.util.Map;

QdrantClient client = new QdrantClient(
    QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.upsertAsync(
    "documents",
    List.of(
        PointStruct.newBuilder()
            .setId(id(1))
            .setVectors(namedVectors(Map.of()))
            .putAllPayload(Map.of(
                "title", value("Document A"),
                "text", value("This is document A")))
            .build(),
        PointStruct.newBuilder()
            .setId(id(2))
            .setVectors(namedVectors(Map.of()))
            .putAllPayload(Map.of(
                "title", value("Document B"),
                "text", value("This is document B")))
            .build())).get();

client.upsertAsync(
    "chunks",
    List.of(
        PointStruct.newBuilder()
            .setId(id(0))
            .setVectors(vectors(0.1f, 0.2f, 0.3f, 0.4f))
            .putAllPayload(Map.of("document_id", value(1)))
            .build(),
        PointStruct.newBuilder()
            .setId(id(1))
            .setVectors(vectors(0.5f, 0.6f, 0.7f, 0.8f))
            .putAllPayload(Map.of("document_id", value(2)))
            .build())).get();
```
