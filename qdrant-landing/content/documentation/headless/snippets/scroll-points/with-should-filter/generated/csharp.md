```csharp
using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

// | operator combines two conditions in an OR disjunction(should)
await client.ScrollAsync(
	collectionName: "{collection_name}",
	filter: MatchKeyword("city", "London") | MatchKeyword("color", "red")
);
```
