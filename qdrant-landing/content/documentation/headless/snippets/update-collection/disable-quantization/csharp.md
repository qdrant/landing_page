```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.UpdateCollectionAsync(
	collectionName: "{collection_name}",
	quantizationConfig: new QuantizationConfigDiff { Disabled = True } // WRONG
);
```
