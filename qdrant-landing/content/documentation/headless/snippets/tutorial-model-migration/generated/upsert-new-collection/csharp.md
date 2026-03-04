```csharp
await client.UpsertAsync(
	collectionName: NEW_COLLECTION,
	points: new List<PointStruct>
	{
		new()
		{
			Id = 1,
			// Use the new embedding model to encode the document
			Vectors = new Document
			{
				Text = "Example document",
				Model = NEW_MODEL
			},
			Payload = { ["text"] = "Example document" }
		}
	}
);
```
