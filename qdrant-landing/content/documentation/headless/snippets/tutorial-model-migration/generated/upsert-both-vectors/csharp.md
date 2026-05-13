```csharp
await client.UpsertAsync(
	collectionName: COLLECTION,
	points: new List<PointStruct>
	{
		new()
		{
			Id = 1,
			Vectors = new Dictionary<string, Vector>
			{
				[OLD_VECTOR] = new Document { Text = "Example document", Model = OLD_MODEL },
				[NEW_VECTOR] = new Document { Text = "Example document", Model = NEW_MODEL },
			},
			Payload = { ["text"] = "Example document" }
		}
	}
);
```
