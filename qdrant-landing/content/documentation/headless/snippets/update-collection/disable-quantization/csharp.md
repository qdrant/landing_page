```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.UpdateCollectionAsync(
	collectionName: "my_collection",
	quantizationConfig: new QuantizationConfigDiff { Disabled = new Disabled() }
);
```
