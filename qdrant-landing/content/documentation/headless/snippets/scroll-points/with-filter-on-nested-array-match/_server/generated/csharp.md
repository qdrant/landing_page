```csharp
using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

await client.ScrollAsync(
	collectionName: "{collection_name}",
	filter: MatchKeyword("country.cities[].sightseeing", "Germany")
);
```
