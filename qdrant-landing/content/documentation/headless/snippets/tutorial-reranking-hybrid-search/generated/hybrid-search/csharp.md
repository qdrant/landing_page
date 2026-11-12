```csharp
results = await client.QueryAsync(
	collectionName: collectionName,
	prefetch: new List<PrefetchQuery>
	{
		new()
		{
			Query = new Document { Text = query, Model = denseEmbeddingModel },
			Using = "dense",
			Limit = 20,
		},
		new()
		{
			Query = new Query { Text = new TextQuery { Query = query } },
			Using = "description",
			Limit = 20,
		},
	},
	query: Fusion.Rrf,
	payloadSelector: true,
	limit: 10
);

foreach (var result in results)
	Console.WriteLine(result);
```
