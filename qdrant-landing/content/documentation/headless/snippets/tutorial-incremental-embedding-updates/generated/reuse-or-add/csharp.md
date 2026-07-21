```csharp
// Reuse an existing embedding when the same text is already stored; embed only what is new.
async Task<(int reused, int added)> ReuseOrAdd(List<Chunk> unknownIds)
{
	int reused = 0, added = 0;

	foreach (var c in unknownIds)
	{
		var sameText = new Filter
		{
			Must = { MatchKeyword("content_hash", c.ContentHash) }
		};
		var hits = (await client.ScrollAsync(
			COLLECTION,
			filter: sameText,
			limit: 1,
			payloadSelector: new[] { "last_updated" },
			vectorsSelector: true
		)).Result;

		PointStruct point;
		if (hits.Count > 0) // same text, new address: copy the vector, keep its last_updated
		{
			point = new PointStruct
			{
				Id = new PointId { Uuid = c.PointId },
				Vectors = hits[0].Vectors.Vector.GetDenseVector()!.Data.ToArray(),
				Payload = { Payload(c, hits[0].Payload["last_updated"].StringValue) },
			};
			reused++;
		}
		else // genuinely new content: embed and insert
		{
			point = new PointStruct
			{
				Id = new PointId { Uuid = c.PointId },
				Vectors = new Document { Text = c.Text, Model = MODEL },
				Payload = { Payload(c) },
			};
			added++;
		}

		await client.UpsertAsync(COLLECTION, points: new List<PointStruct> { point }, wait: true);
	}

	return (reused, added);
}
```
