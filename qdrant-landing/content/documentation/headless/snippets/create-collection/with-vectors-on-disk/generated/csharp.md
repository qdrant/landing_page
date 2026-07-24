```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.CreateCollectionAsync(
	"{collection_name}",
	new VectorParams
	{
		Size = 768,
		Distance = Distance.Cosine,
		Memory = Memory.Cold
	}
);
```
