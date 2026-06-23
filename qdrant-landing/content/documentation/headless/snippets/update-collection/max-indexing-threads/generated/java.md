```java
import io.qdrant.client.grpc.Collections.HnswConfigDiff;
import io.qdrant.client.grpc.Collections.UpdateCollection;

client
    .updateCollectionAsync(
        UpdateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setHnswConfig(
                HnswConfigDiff.newBuilder().setMaxIndexingThreads(4).build())
            .build())
    .get();
```
