```java
import io.qdrant.client.grpc.Collections.OptimizersConfigDiff;
import io.qdrant.client.grpc.Collections.UpdateCollection;

client.updateCollectionAsync(
    UpdateCollection.newBuilder()
        .setCollectionName("{collection_name}")
        .setOptimizersConfig(
            OptimizersConfigDiff.newBuilder().setIndexingThreshold(10000).build())
        .build());
```
