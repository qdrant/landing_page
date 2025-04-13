```java
import java.util.List;
import java.util.Map;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.VectorFactory.vector;
import static io.qdrant.client.VectorsFactory.namedVectors;

client
    .updateVectorsAsync(
        "{collection_name}",
        List.of(
            PointVectors.newBuilder()
                .setId(id(1))
                .setVectors(namedVectors(Map.of("image", vector(List.of(0.1f, 0.2f, 0.3f, 0.4f)))))
                .build(),
            PointVectors.newBuilder()
                .setId(id(2))
                .setVectors(
                    namedVectors(
                        Map.of(
                            "text", vector(List.of(0.9f, 0.8f, 0.7f, 0.6f, 0.5f, 0.4f, 0.3f, 0.2f)))))
                .build()))
    .get();
```
