```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.UpdateCollectionAsync(
	collectionName: "{collection_name}",
	optimizersConfig: new OptimizersConfigDiff { IndexingThreshold = 10000 }
);
```
