```java
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
