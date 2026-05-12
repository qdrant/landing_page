```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.StrictModeConfig;
import io.qdrant.client.grpc.Collections.StrictModeSparse;
import io.qdrant.client.grpc.Collections.StrictModeSparseConfig;

QdrantClient client =
    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());

client
    .createCollectionAsync(
        CreateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setStrictModeConfig(
                StrictModeConfig.newBuilder()
                    .setEnabled(true)
                    .setSparseConfig(
                        StrictModeSparseConfig.newBuilder()
                            .putSparseConfig("{vector_name}", StrictModeSparse.newBuilder().setMaxLength(1000).build())
                            .build())
                    .build())
            .build())
    .get();
```
