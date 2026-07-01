```java
CollectionInfo collectionInfo = client.getCollectionInfoAsync("{collection_name}").get();
long baseEf = collectionInfo.getConfig().getHnswConfig().getEfConstruct();
```
