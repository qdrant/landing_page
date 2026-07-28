```csharp
List<PointStruct> AsPoints(List<Chunk> chunks) =>
	chunks.Select(c => new PointStruct
	{
		Id = new PointId { Uuid = c.PointId },
		Vectors = new Document { Text = c.Text, Model = MODEL }, // embedded by Qdrant Cloud Inference
		Payload = { Payload(c) },
	}).ToList();

await client.UpsertAsync(MAIN, points: AsPoints(Prepare(CHUNKS)), wait: true);
```
