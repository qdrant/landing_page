```csharp
var collectionInfo = await client.GetCollectionInfoAsync("{collection_name}");
var baseEf = collectionInfo.Config.HnswConfig.EfConstruct;
```
