```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.UpdateCollectionAsync(
	collectionName: "{collection_name}",
	collectionParams: new CollectionParamsDiff { ReadFanOutDelayMs = 100 }
);
```
