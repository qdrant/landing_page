```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

await client.QueryAsync(
	collectionName: "{collection_name}",
	query: new float[] { 0.2f, 0.1f, 0.9f, 0.7f },
	filter: MatchKeyword("city", "London"),
	searchParams: new SearchParams { HnswEf = 128, Exact = false },
	limit: 3,
	readConsistency: new ReadConsistency { Type = ReadConsistencyType.Majority }
);
```
