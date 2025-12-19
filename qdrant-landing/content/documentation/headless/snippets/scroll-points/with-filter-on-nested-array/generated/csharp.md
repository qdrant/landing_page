```csharp
using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

await client.ScrollAsync(
	collectionName: "{collection_name}",
	filter: Range("country.cities[].population", new Qdrant.Client.Grpc.Range { Gte = 9.0 })
);
```
