```java
import io.qdrant.client.grpc.Collections.CollectionInfo;
import io.qdrant.client.grpc.Collections.HnswConfigDiff;
import io.qdrant.client.grpc.Collections.UpdateCollection;

CollectionInfo collectionInfo = client.getCollectionInfoAsync("{collection_name}").get();
long baseEf = collectionInfo.getConfig().getHnswConfig().getEfConstruct();

client
    .updateCollectionAsync(
        UpdateCollection.newBuilder()
            .setCollectionName("{collection_name}")
            .setHnswConfig(
                HnswConfigDiff.newBuilder()
                    .setEfConstruct(baseEf + 1)
                    .build())
            .build())
    .get();
```
