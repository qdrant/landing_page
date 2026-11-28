```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

var results = await client.QueryAsync(
	collectionName: "venues",
	query: new Document
	{
		Text = "quiet café to work from",
		Model = "sentence-transformers/all-minilm-l6-v2",
	},
	filter: new Filter
	{
		Must = { GeoRadius("location", 52.520711, 13.403683, 1500.0f) }
	},
	limit: 5
);
```
