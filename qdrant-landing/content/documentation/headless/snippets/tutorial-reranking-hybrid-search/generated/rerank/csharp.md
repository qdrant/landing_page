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
			Query = new Document { Text = query, Model = sparseEmbeddingModel },
			Using = "sparse",
			Limit = 20,
		},
	},
	query: new Document { Text = query, Model = lateInteractionEmbeddingModel },
	usingVector: "multi",
	payloadSelector: true,
	limit: 10
);

foreach (var result in results)
	Console.WriteLine(result);
```
