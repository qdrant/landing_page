```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

await client.ScrollAsync(
	collectionName: "{collection_name}",
	filter: new Filter { MustNot = { MatchKeyword("city", "London") & MatchKeyword("color", "red") } }
);
```
