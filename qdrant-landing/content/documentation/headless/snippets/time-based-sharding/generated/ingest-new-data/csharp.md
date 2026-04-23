```csharp
await client.UpsertAsync(
	collectionName: collectionName,
	points: new List<PointStruct>
	{
		new()
		{
			Id = Guid.NewGuid(),
			Vectors = new Dictionary<string, Vector>
			{
				["dense_vector"] = new Document
				{
					Text = "The best way to start a Wednesday is with a cup of coffee",
					Model = denseModel
				}
			},
			Payload =
			{
				["text"] = "The best way to start a Wednesday is with a cup of coffee",
				["datetime"] = "2026-04-08T07:57:47"
			}
		}
	},
	shardKeySelector: new ShardKeySelector
	{
		ShardKeys = { new List<ShardKey> { today } }
	}
);
```
