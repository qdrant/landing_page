```csharp
using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

// | operator combines two conditions in an OR disjunction(should)
await client.ScrollAsync(
	collectionName: "{collection_name}",
	filter: MatchKeyword("city", "London") | MatchKeyword("color", "red")
);
```
