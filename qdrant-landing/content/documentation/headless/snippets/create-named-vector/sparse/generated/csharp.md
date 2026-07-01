```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.CreateVectorNameAsync(new()
{
	CollectionName = "{collection_name}",
	VectorName = "{vector_name}",
	SparseConfig = new() { Modifier = Modifier.Idf }
});
```
