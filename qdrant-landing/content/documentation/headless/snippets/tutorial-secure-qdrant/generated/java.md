```java
import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.VectorsFactory.vectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Points.PointStruct;
import java.util.List;

client = new QdrantClient(
    QdrantGrpcClient.newBuilder("localhost", 6334, true).build());

try {
    client.createCollectionAsync("my_collection",
        VectorParams.newBuilder()
            .setSize(4)
            .setDistance(Distance.Cosine)
            .build()).get();

    client.upsertAsync("my_collection", List.of(
        PointStruct.newBuilder()
            .setId(id(1))
            .setVectors(vectors(0.1f, 0.2f, 0.3f, 0.4f))
            .build()
    )).get();
} catch (Exception e) {
    System.out.println(e.getMessage()); // UNAUTHENTICATED
}

client = new QdrantClient(
    QdrantGrpcClient.newBuilder("localhost", 6334, true)
        .withApiKey("my-admin-key")
        .build());

client.createCollectionAsync("my_collection",
    VectorParams.newBuilder()
        .setSize(4)
        .setDistance(Distance.Cosine)
        .build()).get();

client.upsertAsync("my_collection", List.of(
    PointStruct.newBuilder()
        .setId(id(1))
        .setVectors(vectors(0.1f, 0.2f, 0.3f, 0.4f))
        .build()
)).get();

client = new QdrantClient(
    QdrantGrpcClient.newBuilder("localhost", 6334, true)
        .withApiKey("my-read-only-key")
        .build());

try {
    client.deleteAsync("my_collection", List.of(id(1))).get();
} catch (Exception e) {
    System.out.println(e.getMessage()); // PERMISSION_DENIED
}

client = new QdrantClient(
    QdrantGrpcClient.newBuilder("localhost", 6334, true)
        .withApiKey("<your-jwt>")
        .build());

client.upsertAsync("my_collection", List.of(
    PointStruct.newBuilder()
        .setId(id(2))
        .setVectors(vectors(0.5f, 0.6f, 0.7f, 0.8f))
        .build()
)).get();

client = new QdrantClient(
    QdrantGrpcClient.newBuilder("localhost", 6334, true)
        .withApiKey("<your-jwt>")
        .build());

try {
    client.upsertAsync("other_collection", List.of(
        PointStruct.newBuilder()
            .setId(id(2))
            .setVectors(vectors(0.5f, 0.6f, 0.7f, 0.8f))
            .build()
    )).get();
} catch (Exception e) {
    System.out.println(e.getMessage()); // PERMISSION_DENIED
}
```
