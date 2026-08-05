```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections;

client.createCollectionAsync(
    Collections.CreateCollection.newBuilder()
        .setCollectionName("{collection_name}")
        .setSparseVectorsConfig(
            Collections.SparseVectorConfig.newBuilder().putMap(
                "text",
                Collections.SparseVectorParams.newBuilder()
                    .setIndex(
                        Collections.SparseIndexConfig
                            .newBuilder()
                            .setMemory(Collections.Memory.Cold)
                            .build()
                    ).build()
            ).build()
        ).build()
).get();
```
