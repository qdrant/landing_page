```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.UpdateCollection;
import io.qdrant.client.grpc.Collections.StrictModeConfig;

client
    .updateCollectionAsync(
        UpdateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setStrictModeConfig(
                StrictModeConfig.newBuilder()
                    .setEnabled(true)
                    .setUnindexedFilteringRetrieve(true)
                    .build())
            .build())
    .get();
```
