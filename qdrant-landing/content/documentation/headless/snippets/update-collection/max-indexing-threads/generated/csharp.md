```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.UpdateCollectionAsync(
	collectionName: "{collection_name}",
	hnswConfig: new HnswConfigDiff { MaxIndexingThreads = 4 }
);
```
