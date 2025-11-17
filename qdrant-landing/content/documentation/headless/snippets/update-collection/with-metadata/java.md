```java
import java.util.Map;

import static io.qdrant.client.ValueFactory.value;

import io.qdrant.client.grpc.Collections.OptimizersConfigDiff;
import io.qdrant.client.grpc.Collections.UpdateCollection;

client
    .updateCollectionAsync(
        UpdateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setOptimizersConfig(
                OptimizersConfigDiff.newBuilder().setIndexingThreshold(10000).build())
            .putAllMetadata(
                Map.of(
                    "my-metadata-field",
                    value(
                        Map.of(
                            "key-a", value("value-a"),
                            "key-b", value(42)))))
            .build())
    .get();
```
