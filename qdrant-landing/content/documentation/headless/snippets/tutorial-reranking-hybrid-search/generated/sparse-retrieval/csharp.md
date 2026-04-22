```csharp
results = await client.QueryAsync(
	collectionName: collectionName,
	query: new Document { Text = query, Model = sparseEmbeddingModel },
	usingVector: "sparse",
	limit: 10
);

foreach (var result in results)
	Console.WriteLine(result);
```
