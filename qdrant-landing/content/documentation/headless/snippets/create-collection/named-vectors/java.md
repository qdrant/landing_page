```java
import java.util.Map;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.SparseVectorConfig;
import io.qdrant.client.grpc.Collections.SparseVectorParams;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorParamsMap;
import io.qdrant.client.grpc.Collections.VectorsConfig;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync(
        CreateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setVectorsConfig(VectorsConfig.newBuilder().setParamsMap(
                VectorParamsMap.newBuilder().putAllMap(Map.of("image",
                    VectorParams.newBuilder()
                        .setSize(4)
                        .setDistance(Distance.Dot)
                        .build(),
                    "text",
                    VectorParams.newBuilder()
                        .setSize(5)
                        .setDistance(Distance.Cosine)
                        .build()))))
            .setSparseVectorsConfig(SparseVectorConfig.newBuilder().putMap(
                "text-sparse", SparseVectorParams.getDefaultInstance()))
            .build())
    .get();
```
