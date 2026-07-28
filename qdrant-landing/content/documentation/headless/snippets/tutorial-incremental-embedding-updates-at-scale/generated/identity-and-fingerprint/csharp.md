```csharp
string Sha256Hex(string text) =>
	Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(text))).ToLowerInvariant();

string ContentHash(string text) => Sha256Hex(text);

// .NET has no UUIDv5, so the point ID is a Guid built from the first 16 bytes of the
// address hash. Just as stable and deterministic, but it does not match the Python tab's
// uuid5 values, so every ID, bucket, and digest printed in this tutorial is Python's.
string PointIdFor(string url, string anchor, int num) =>
	new Guid(SHA256.HashData(Encoding.UTF8.GetBytes($"{url}#{anchor}::{num}")).AsSpan(0, 16)).ToString();

// Attach the derived values every later step depends on.
List<Chunk> Prepare(List<Chunk> chunks)
{
	var prepared = new List<Chunk>();
	foreach (var c in chunks)
	{
		// Run c.Text through your normalization pass before hashing it.
		prepared.Add(c with
		{
			SectionUrl = c.Anchor != "" ? $"{c.Url}#{c.Anchor}" : c.Url,
			ContentHash = ContentHash(c.Text),
			PointId = PointIdFor(c.Url, c.Anchor, c.ChunkNum),
		});
	}
	return prepared;
}
```
