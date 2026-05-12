```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.DeleteVectorNameAsync(new()
{
	CollectionName = "{collection_name}",
	VectorName = "{vector_name}"
});
```
