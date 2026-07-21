```csharp
async Task<Dictionary<string, long>> Sync(List<Chunk> latestChunks)
{
	await CheckGate(); // refuse to mix embedding models or pipeline versions

	var chunks = PrepareChunksForSync(latestChunks);
	var (incomingIds, unchanged, contentChanged, unknownIds) = await SplitByState(chunks);

	await ReEmbedChanged(contentChanged);
	var (reused, added) = await ReuseOrAdd(unknownIds);
	var deleted = await DeleteGone(incomingIds);

	return new Dictionary<string, long>
	{
		["unchanged"] = unchanged.Count,
		["re-embedded"] = contentChanged.Count,
		["reused_embedding"] = reused,
		["added"] = added,
		["deleted"] = (long)deleted,
	};
}
```
