```java
import io.qdrant.client.grpc.Collections.OptimizersConfigDiff;
import io.qdrant.client.grpc.Collections.UpdateCollection;

client.updateCollectionAsync(
    UpdateCollection.newBuilder()
        .setCollectionName("{collection_name}")
        .setOptimizersConfig(
            OptimizersConfigDiff.getDefaultInstance())
        .build());
```
