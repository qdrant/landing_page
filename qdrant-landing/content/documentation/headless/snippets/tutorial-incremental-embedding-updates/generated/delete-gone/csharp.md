```csharp
// Remove every point the current crawl no longer contains. Returns how many.
async Task<ulong> DeleteGone(Dictionary<string, Chunk> incomingIds)
{
	if (incomingIds.Count == 0)
		throw new ArgumentException("Refusing to delete from an empty source snapshot.");

	var stale = new Filter
	{
		MustNot = { HasId(incomingIds.Keys.Select(Guid.Parse).ToList()) }
	};

	var toDelete = await client.CountAsync(COLLECTION, filter: stale);

	// potential check against a threshold to avoid accidental mass deletion could be added here
	await client.DeleteAsync(COLLECTION, filter: stale, wait: true);
	return toDelete;
}
```
