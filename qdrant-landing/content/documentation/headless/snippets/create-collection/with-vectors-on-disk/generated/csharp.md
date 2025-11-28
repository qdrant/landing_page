```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	"{collection_name}",
	new VectorParams
	{
		Size = 768,
		Distance = Distance.Cosine,
		OnDisk = true
	}
);
```
