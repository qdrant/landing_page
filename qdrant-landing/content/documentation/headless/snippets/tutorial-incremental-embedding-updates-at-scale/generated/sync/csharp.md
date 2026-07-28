```csharp
async Task<(List<int> changedBuckets, int added, int reEmbedded, int deleted)> Sync(List<Chunk> latestChunks)
{
	var latest = Prepare(latestChunks);

	// group the source chunks by bucket once
	var sourceByBucket = new Dictionary<int, Dictionary<string, Chunk>>();
	foreach (var c in latest)
	{
		if (!sourceByBucket.TryGetValue(Bucket(c.PointId), out var inBucket))
			sourceByBucket[Bucket(c.PointId)] = inBucket = new Dictionary<string, Chunk>();
		inBucket[c.PointId] = c;
	}

	// steps 1-3: which buckets changed
	var source = ComputeDigests(latest);
	var stored = await ReadMeta();
	var changed = new List<int>();
	for (var b = 0; b < N_BUCKETS; b++)
		if (source[b] != stored[b])
			changed.Add(b);

	// step 4: reconcile each changed bucket
	int added = 0, reEmbedded = 0, deleted = 0;
	foreach (var b in changed)
	{
		var counts = await ReconcileBucket(b, sourceByBucket.GetValueOrDefault(b, new Dictionary<string, Chunk>()));
		added += counts.added;
		reEmbedded += counts.reEmbedded;
		deleted += counts.deleted;
	}

	// step 5: rewrite only the changed groups of the summary, after the data writes
	var changedGroups = changed.Select(b => b / GROUP_SIZE).Distinct().ToList();
	await WriteMeta(source, changedGroups);

	return (changed, added, reEmbedded, deleted);
}
```
