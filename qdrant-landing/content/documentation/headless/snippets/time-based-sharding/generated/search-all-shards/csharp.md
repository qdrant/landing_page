```csharp
result = await client.QueryAsync(
	collectionName: collectionName,
	query: new Document { Text = queryText, Model = denseModel },
	usingVector: "dense_vector",
	limit: 5
);

foreach (var hit in result)
	Console.WriteLine(hit);
```
