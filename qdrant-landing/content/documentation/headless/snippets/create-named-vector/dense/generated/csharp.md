```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.CreateVectorNameAsync(new()
{
	CollectionName = "{collection_name}",
	VectorName = "{vector_name}",
	DenseConfig = new() { Size = 256, Distance = Distance.Cosine }
});
```
