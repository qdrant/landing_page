```java
import java.util.List;
import java.util.Map;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorsFactory.vectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.PointStruct;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .upsertAsync(
        "{collection_name}",
        List.of(
            PointStruct.newBuilder()
                .setId(id(1))
                .setVectors(vectors(0.05f, 0.61f, 0.76f, 0.74f))
                .putAllPayload(Map.of("city", value("Berlin"), "price", value(1.99)))
                .build(),
            PointStruct.newBuilder()
                .setId(id(2))
                .setVectors(vectors(0.19f, 0.81f, 0.75f, 0.11f))
                .putAllPayload(
                    Map.of("city", list(List.of(value("Berlin"), value("London")))))
                .build(),
            PointStruct.newBuilder()
                .setId(id(3))
                .setVectors(vectors(0.36f, 0.55f, 0.47f, 0.94f))
                .putAllPayload(
                    Map.of(
                        "city",
                        list(List.of(value("Berlin"), value("London"))),
                        "price",
                        list(List.of(value(1.99), value(2.99)))))
                .build()))
    .get();
```
