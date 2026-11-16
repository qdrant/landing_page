```java
import io.qdrant.client.grpc.Collections.OptimizersConfigDiff;
import io.qdrant.client.grpc.Collections.UpdateCollection;

client
    .updateCollectionAsync(
        UpdateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setOptimizersConfig(
                OptimizersConfigDiff.newBuilder()
                    .setDefaultSegmentNumber(4)
                    .setMaxSegmentSize(1000000)
                    .build())
            .build())
    .get();
```
