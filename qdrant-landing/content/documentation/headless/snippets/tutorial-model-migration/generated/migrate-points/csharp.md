```csharp
PointId? lastOffset = null;
uint limit = 100; // Number of points to read in each batch
bool reachedEnd = false;

while (!reachedEnd)
{
	// Get the next batch of points from the old collection
	var scrollResult = await client.ScrollAsync(
		collectionName: OLD_COLLECTION,
		limit: limit,
		offset: lastOffset,
		// Include payloads in the response, as we need them to re-embed the vectors
		payloadSelector: true,
		// We don't need the old vectors, so let's save on the bandwidth
		vectorsSelector: false
	);

	var records = scrollResult.Result;
	lastOffset = scrollResult.NextPageOffset;

	// Re-embed the points using the new model
	var points = new List<PointStruct>();
	foreach (var record in records)
	{
		var text = record.Payload.ContainsKey("text")
			? record.Payload["text"].StringValue
			: "";

		points.Add(new PointStruct
		{
			// Keep the original ID to ensure consistency
			Id = record.Id,
			// Use the new embedding model to encode the text from the payload,
			// assuming that was the original source of the embedding
			Vectors = new Document
			{
				Text = text,
				Model = NEW_MODEL
			},
			// Keep the original payload
			Payload = { record.Payload }
		});
	}

	// Upsert the re-embedded points into the new collection
	await client.UpsertAsync(
		new()
		{
			CollectionName = NEW_COLLECTION,
			Points = { points },
			// Only insert the point if a point with this ID does not already exist.
			UpdateMode = UpdateMode.InsertOnly
		}
	);

	// Check if we reached the end of the collection
	reachedEnd = (lastOffset == null);
}
```
