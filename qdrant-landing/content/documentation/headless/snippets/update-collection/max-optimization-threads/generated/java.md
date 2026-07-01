```java
import io.qdrant.client.grpc.Collections.MaxOptimizationThreads;
import io.qdrant.client.grpc.Collections.OptimizersConfigDiff;
import io.qdrant.client.grpc.Collections.UpdateCollection;

client
    .updateCollectionAsync(
        UpdateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setOptimizersConfig(
                OptimizersConfigDiff.newBuilder()
                .setMaxOptimizationThreads(
                    MaxOptimizationThreads.newBuilder().setValue(1).build())
                .build())
            .build())
    .get();
```
