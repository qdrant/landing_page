```csharp
await client.UpsertAsync(
	collectionName: OLD_COLLECTION,
	points: new List<PointStruct>
	{
		new()
		{
			Id = 1,
			Vectors = new Document
			{
				Text = "Example document",
				Model = OLD_MODEL
			},
			Payload = { ["text"] = "Example document" }
		}
	}
);
```
