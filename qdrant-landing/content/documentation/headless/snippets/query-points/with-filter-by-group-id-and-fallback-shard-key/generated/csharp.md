```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

await client.QueryAsync(
	collectionName: "{collection_name}",
	query: new float[] { 0.1f, 0.1f, 0.9f },
	filter: MatchKeyword("group_id", "user_1"),
	shardKeySelector: new ShardKeySelector {
		ShardKeys = { new List<ShardKey> { "user_1" } },
		Fallback = new ShardKey { Keyword = "default" }
	},
	limit: 10
);
```
