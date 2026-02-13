```csharp
var hits = await client.QueryAsync(
	collectionName: COLLECTION_NAME,
	query: new Document
	{
		Text = "alien invasion",
		Model = EMBEDDING_MODEL
	},
	limit: 3
);

foreach (var hit in hits)
{
	Console.WriteLine($"{hit.Payload} score: {hit.Score}");
}
```
