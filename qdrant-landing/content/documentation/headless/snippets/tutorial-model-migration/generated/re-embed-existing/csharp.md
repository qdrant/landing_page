```csharp
PointId? reEmbedLastOffset = null;
uint reEmbedBatchSize = 100;
bool reEmbedReachedEnd = false;

while (!reEmbedReachedEnd)
{
	var reEmbedScrollResult = await client.ScrollAsync(
		collectionName: COLLECTION,
		limit: reEmbedBatchSize,
		offset: reEmbedLastOffset,
		payloadSelector: true,
		vectorsSelector: false
	);

	var reEmbedRecords = reEmbedScrollResult.Result;
	reEmbedLastOffset = reEmbedScrollResult.NextPageOffset;

	var pointVectors = new List<PointVectors>();
	foreach (var record in reEmbedRecords)
	{
		var text = record.Payload.ContainsKey("text")
			? record.Payload["text"].StringValue
			: "";

		// Update only the new vector on each point; the old vector and payload are untouched
		pointVectors.Add(new PointVectors
		{
			Id = record.Id,
			Vectors = new Dictionary<string, Vector>
			{
				[NEW_VECTOR] = new Document { Text = text, Model = NEW_MODEL }
			}
		});
	}

	await client.UpdateVectorsAsync(collectionName: COLLECTION, points: pointVectors);

	reEmbedReachedEnd = (reEmbedLastOffset == null);
}
```
