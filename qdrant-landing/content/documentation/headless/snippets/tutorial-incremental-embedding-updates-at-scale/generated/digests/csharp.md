```csharp
long ChunkDigest(string pid, string chash)
{
	// First 15 hex digits of the combined hash = a 60-bit number.
	// 60 bits fits Qdrant's signed 64-bit integer payload, so digests store as plain integers.
	var combined = Sha256Hex(pid + chash);
	return Convert.ToInt64(combined[..15], 16);
}

long[] ComputeDigests(List<Chunk> chunks)
{
	var digests = new long[N_BUCKETS];
	foreach (var c in chunks)
	{
		var b = Bucket(c.PointId);
		digests[b] ^= ChunkDigest(c.PointId, c.ContentHash);
	}
	return digests;
}

ComputeDigests(Prepare(CHUNKS));
```
