```csharp
var filteredHits = await client.QueryAsync(
	collectionName: COLLECTION_NAME,
	query: new Document
	{
		Text = "alien invasion",
		Model = EMBEDDING_MODEL
	},
	filter: new Filter
	{
		Must = { Range("year", new Qdrant.Client.Grpc.Range { Gte = 2000.0 }) }
	},
	limit: 1
);

foreach (var hit in filteredHits)
{
	Console.WriteLine($"{hit.Payload} score: {hit.Score}");
}
```
