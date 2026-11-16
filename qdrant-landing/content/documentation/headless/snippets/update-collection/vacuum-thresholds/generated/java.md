```java
import io.qdrant.client.grpc.Collections.OptimizersConfigDiff;
import io.qdrant.client.grpc.Collections.UpdateCollection;

client
    .updateCollectionAsync(
        UpdateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setOptimizersConfig(
                OptimizersConfigDiff.newBuilder()
                    .setDeletedThreshold(0.2)
                    .setVacuumMinVectorNumber(1000)
                    .build())
            .build())
    .get();
```
