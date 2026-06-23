```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.UpdateCollectionAsync(
	collectionName: "{collection_name}",
	optimizersConfig: new OptimizersConfigDiff { MaxOptimizationThreads = new MaxOptimizationThreads { Value = 1 } }
);
```
