```csharp
// Store bucket digests in the summary collection, one point per group.
// digests: the full list of N_BUCKETS digests.
// groups:  which group points to rewrite; null rewrites all of them.
async Task WriteMeta(long[] digests, IEnumerable<int>? groups = null)
{
	groups ??= Enumerable.Range(0, N_META);

	var points = new List<PointStruct>();
	foreach (var g in groups)
	{
		// group g holds buckets [g * GROUP_SIZE .. g * GROUP_SIZE + GROUP_SIZE - 1]
		var start = g * GROUP_SIZE;
		var groupDigests = digests[start..(start + GROUP_SIZE)].Select(d => (Value)d).ToArray();
		points.Add(new PointStruct
		{
			Id = new PointId { Num = (ulong)g },
			Vectors = new float[] { 1.0f }, // dummy: this collection is never searched
			Payload = { ["group"] = g, ["digests"] = groupDigests },
		});
	}
	await client.UpsertAsync(META, points: points, wait: true);
}

// Read the summary back as a flat list of N_BUCKETS digests.
async Task<long[]> ReadMeta()
{
	var digests = new long[N_BUCKETS];
	var points = await client.RetrieveAsync(
		META,
		ids: Enumerable.Range(0, N_META).Select(g => new PointId { Num = (ulong)g }).ToList(),
		payloadSelector: true,
		vectorSelector: false
	);

	foreach (var point in points)
	{
		var g = (int)point.Payload["group"].IntegerValue;
		var groupDigests = point.Payload["digests"].ListValue.Values;
		for (var slot = 0; slot < groupDigests.Count; slot++)
			digests[g * GROUP_SIZE + slot] = groupDigests[slot].IntegerValue;
	}
	return digests;
}

await WriteMeta(ComputeDigests(Prepare(CHUNKS)));
await ReadMeta();
```
