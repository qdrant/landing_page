```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
	collectionName: "{collection_name}",
	query: new float[] { 0.1f, 0.1f, 0.9f },
	filter: MatchKeyword("group_id", "user_1"),
	limit: 10
);
```
