```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	vectorsConfig: new VectorParams { Size = 768, Distance = Distance.Cosine },
	optimizersConfig: new OptimizersConfigDiff { DefaultSegmentNumber = 2, MaxSegmentSize = 5000000 }
);
```
