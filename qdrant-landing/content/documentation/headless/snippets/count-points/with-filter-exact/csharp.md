```csharp
using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

await client.CountAsync(
	collectionName: "{collection_name}",
	filter: MatchKeyword("color", "red"),
	exact: true
);
```
