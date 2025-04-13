```java
import java.util.List;
import java.util.Map;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.VectorFactory.vector;

import io.qdrant.client.grpc.Points.NamedVectors;
import io.qdrant.client.grpc.Points.PointStruct;
import io.qdrant.client.grpc.Points.Vectors;

client
    .upsertAsync(
        "{collection_name}",
        List.of(
            PointStruct.newBuilder()
                .setId(id(1))
                .setVectors(
                    Vectors.newBuilder()
                        .setVectors(
                            NamedVectors.newBuilder()
                                .putAllVectors(
                                    Map.of(
                                        "text", vector(List.of(1.0f, 2.0f), List.of(6, 7))))
                                .build())
                        .build())
                .build(),
            PointStruct.newBuilder()
                .setId(id(2))
                .setVectors(
                    Vectors.newBuilder()
                        .setVectors(
                            NamedVectors.newBuilder()
                                .putAllVectors(
                                    Map.of(
                                        "text",
                                        vector(
                                            List.of(0.1f, 0.2f, 0.3f, 0.4f, 0.5f),
                                            List.of(1, 2, 3, 4, 5))))
                                .build())
                        .build())
                .build()))
    .get();
```
