```java
import io.qdrant.client.grpc.Collections.Disabled;
import io.qdrant.client.grpc.Collections.QuantizationConfigDiff;
import io.qdrant.client.grpc.Collections.UpdateCollection;

client.updateCollectionAsync(
    UpdateCollection.newBuilder()
        .setCollectionName("{collection_name}")
        .setQuantizationConfig(
            QuantizationConfigDiff.newBuilder()
                .setDisabled(Disabled.getDefaultInstance())
                .build())
        .build());
```
