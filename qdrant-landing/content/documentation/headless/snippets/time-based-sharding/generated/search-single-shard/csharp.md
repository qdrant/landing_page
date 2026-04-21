```csharp
string queryText = "coffee";

var result = await client.QueryAsync(
	collectionName: collectionName,
	query: new Document { Text = queryText, Model = denseModel },
	usingVector: "dense_vector",
	limit: 5,
	shardKeySelector: new ShardKeySelector
	{
		ShardKeys = { new List<ShardKey> { "2026-04-07" } }
	}
);

foreach (var hit in result)
	Console.WriteLine(hit);
```
