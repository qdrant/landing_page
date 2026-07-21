```csharp
// Compare the incoming chunk list to the collection: who is unchanged, changed, or unknown.
async Task<(Dictionary<string, Chunk> incomingIds, List<Chunk> unchanged, List<Chunk> contentChanged, List<Chunk> unknownIds)>
	SplitByState(List<Chunk> latestChunks)
{
	var incoming = latestChunks.ToDictionary(c => c.PointId);

	var stored = new Dictionary<string, string>();
	var points = await client.RetrieveAsync(
		COLLECTION,
		ids: incoming.Keys.Select(pid => new PointId { Uuid = pid }).ToList(),
		payloadSelector: new[] { "content_hash" },
		vectorSelector: false
	);
	foreach (var p in points)
		stored[p.Id.Uuid] = p.Payload["content_hash"].StringValue;

	var unchanged = new List<Chunk>();
	var contentChanged = new List<Chunk>();
	var unknownIds = new List<Chunk>();
	foreach (var (pid, c) in incoming)
	{
		if (stored.TryGetValue(pid, out var hash) && hash == c.ContentHash)
			unchanged.Add(c);
		else if (stored.ContainsKey(pid))
			contentChanged.Add(c);
		else
			unknownIds.Add(c);
	}

	return (incoming, unchanged, contentChanged, unknownIds);
}

var splitState = await SplitByState(LATEST_CHUNKS);
```
