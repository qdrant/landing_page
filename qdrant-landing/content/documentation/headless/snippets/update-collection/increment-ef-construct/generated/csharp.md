```csharp
var collectionInfo = await client.GetCollectionInfoAsync("{collection_name}");
var baseEf = collectionInfo.Config.HnswConfig.EfConstruct;

await client.UpdateCollectionAsync(
	collectionName: "{collection_name}",
	hnswConfig: new HnswConfigDiff { EfConstruct = baseEf + 1 }
);
```
