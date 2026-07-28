```csharp
// Make bucket b in Qdrant match sourceChunks. Returns the counts of what it did.
async Task<(int added, int reEmbedded, int deleted)> ReconcileBucket(int b, Dictionary<string, Chunk> sourceChunks)
{
	var stored = await ReadBucket(b); // point ID -> content hash currently in Qdrant

	var toWrite = new List<Chunk>();  // new or content-changed chunks: embed and upsert
	int added = 0, reEmbedded = 0;
	foreach (var (pid, chunk) in sourceChunks)
	{
		if (!stored.TryGetValue(pid, out var storedHash))
		{
			toWrite.Add(chunk);       // new chunk in this bucket
			added++;
		}
		else if (storedHash != chunk.ContentHash)
		{
			toWrite.Add(chunk);       // same chunk, changed text
			reEmbedded++;
		}
	}

	// chunks Qdrant has but the source no longer does
	var toDelete = stored.Keys.Where(pid => !sourceChunks.ContainsKey(pid)).Select(Guid.Parse).ToList();

	if (toWrite.Count > 0)
		await client.UpsertAsync(MAIN, points: AsPoints(toWrite), wait: true);
	if (toDelete.Count > 0)
		await client.DeleteAsync(MAIN, ids: toDelete, wait: true);

	return (added, reEmbedded, toDelete.Count);
}
```
