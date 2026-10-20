```csharp
using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

// & operator combines two conditions in an AND conjunction(must)
await client.ScrollAsync(
	collectionName: "{collection_name}",
	filter: MatchKeyword("city", "London") & MatchKeyword("color", "red")
);
```
