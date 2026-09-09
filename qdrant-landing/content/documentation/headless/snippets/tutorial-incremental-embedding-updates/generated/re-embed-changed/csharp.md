```csharp
async Task ReEmbedChanged(List<Chunk> contentChanged)
{
	if (contentChanged.Count == 0)
		return;
	await client.UpsertAsync(
		collectionName: COLLECTION,
		points: contentChanged.Select(c => new PointStruct
		{
			Id = new PointId { Uuid = c.PointId },
			Vectors = new Document { Text = c.Text, Model = MODEL },
			Payload = { Payload(c) },
		}).ToList(),
		wait: true
	);
}
```
