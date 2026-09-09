```csharp
await client.UpsertAsync(
	collectionName: COLLECTION,
	points: PrepareChunksForSync(CHUNKS).Select(c => new PointStruct
	{
		Id = new PointId { Uuid = c.PointId },
		Vectors = new Document { Text = c.Text, Model = MODEL },
		Payload = { Payload(c) },
	}).ToList(),
	wait: true
);
```
