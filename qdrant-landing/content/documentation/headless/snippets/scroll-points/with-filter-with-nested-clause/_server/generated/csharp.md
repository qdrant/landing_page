```csharp
using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

await client.ScrollAsync(
	collectionName: "{collection_name}",
	filter: Nested("diet", MatchKeyword("food", "meat") & Match("likes", true))
);
```
