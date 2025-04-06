```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;

import io.qdrant.client.grpc.Collections;

QdrantClient client = new QdrantClient(
    QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client.createCollectionAsync(
    Collections.CreateCollection.newBuilder()
        .setCollectionName("{collection_name}")
        .setSparseVectorsConfig(
            Collections.SparseVectorConfig.newBuilder().putMap(
                "splade-model-name",
                Collections.SparseVectorParams.newBuilder()
                    .setIndex(
                        Collections.SparseIndexConfig
                            .newBuilder()
                            .setOnDisk(false)
                            .build()
                    ).build()
            ).build()
        ).build()
).get();

```
