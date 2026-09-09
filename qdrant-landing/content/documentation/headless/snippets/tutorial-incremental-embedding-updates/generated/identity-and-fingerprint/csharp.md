```csharp
string ContentHash(string text) =>
	Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(text))).ToLowerInvariant();

// Qdrant accepts any well-formed UUID as a point ID:
// a Guid built from the first 16 bytes of the address hash, so the same address always yields the same ID
string PointIdFor(string url, string anchor, int num) =>
	new Guid(SHA256.HashData(Encoding.UTF8.GetBytes($"{url}#{anchor}::{num}")).AsSpan(0, 16)).ToString();

// Derive both values (and the section address) for every raw chunk.
List<Chunk> PrepareChunksForSync(List<Chunk> chunks)
{
	var prepared = new List<Chunk>();
	foreach (var c in chunks)
	{
		var text = Normalize(c.Text);
		prepared.Add(c with
		{
			Text = text,
			SectionUrl = c.Anchor != "" ? $"{c.Url}#{c.Anchor}" : c.Url,
			ContentHash = ContentHash(text),
			PointId = PointIdFor(c.Url, c.Anchor, c.ChunkNum),
		});
	}
	return prepared;
}
```
