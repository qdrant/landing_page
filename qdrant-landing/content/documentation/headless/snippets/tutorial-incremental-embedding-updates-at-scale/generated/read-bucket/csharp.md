```csharp
// Return a map of point ID to content hash for every chunk stored in bucket b.
// Pages through the results so nothing is missed in a large bucket.
async Task<Dictionary<string, string>> ReadBucket(int b)
{
	var stored = new Dictionary<string, string>();
	PointId? offset = null;

	while (true)
	{
		var response = await client.ScrollAsync(
			MAIN,
			filter: new Filter { Must = { Match("sync_bucket", b) } },
			limit: 1000,
			offset: offset,
			payloadSelector: new[] { "content_hash" },
			vectorsSelector: false
		);

		foreach (var point in response.Result)
			stored[point.Id.Uuid] = point.Payload["content_hash"].StringValue;

		offset = response.NextPageOffset;
		if (offset is null)
			return stored;
	}
}
```
