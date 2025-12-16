```csharp
using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

// The ! operator negates the condition(must not)
await client.ScrollAsync(
	collectionName: "{collection_name}",
	filter: !(MatchKeyword("city", "London") & MatchKeyword("color", "red"))
);
```
