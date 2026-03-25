```csharp
results = await client.QueryAsync(
	collectionName: NEW_COLLECTION,
	query: new Document
	{
		Text = "my query",
		Model = NEW_MODEL
	},
	limit: 10
);
```
