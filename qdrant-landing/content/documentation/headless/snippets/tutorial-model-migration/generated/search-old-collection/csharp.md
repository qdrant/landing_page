```csharp
var results = await client.QueryAsync(
	collectionName: OLD_COLLECTION,
	query: new Document
	{
		Text = "my query",
		Model = OLD_MODEL
	},
	limit: 10
);
```
