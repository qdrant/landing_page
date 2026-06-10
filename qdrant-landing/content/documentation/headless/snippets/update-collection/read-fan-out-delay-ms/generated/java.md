```java
import io.qdrant.client.grpc.Collections.CollectionParamsDiff;
import io.qdrant.client.grpc.Collections.UpdateCollection;

client
    .updateCollectionAsync(
        UpdateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setParams(
                CollectionParamsDiff.newBuilder().setReadFanOutDelayMs(100).build())
            .build())
    .get();
```
