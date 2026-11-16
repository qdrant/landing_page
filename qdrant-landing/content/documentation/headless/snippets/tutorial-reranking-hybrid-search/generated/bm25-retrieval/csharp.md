```csharp
results = await client.QueryAsync(
	collectionName: collectionName,
	query: new Query { Text = new TextQuery { Query = query } },
	usingVector: "description",
	limit: 10
);

foreach (var result in results)
	Console.WriteLine(result);
```
