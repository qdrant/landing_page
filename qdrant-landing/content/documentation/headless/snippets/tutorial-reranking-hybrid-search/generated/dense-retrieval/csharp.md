```csharp
string query = "time travel";

var results = await client.QueryAsync(
	collectionName: collectionName,
	query: new Document { Text = query, Model = denseEmbeddingModel },
	usingVector: "dense",
	limit: 10
);

foreach (var result in results)
	Console.WriteLine(result);
```
