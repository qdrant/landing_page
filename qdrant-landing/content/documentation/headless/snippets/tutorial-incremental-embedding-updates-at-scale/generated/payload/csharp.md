```csharp
Dictionary<string, Value> Payload(Chunk c) => new()
{
	["url"] = c.Url,
	["anchor"] = c.Anchor,
	["chunk_num"] = c.ChunkNum,
	["section_url"] = c.SectionUrl,
	["text"] = c.Text,
	["content_hash"] = c.ContentHash,
	["sync_bucket"] = Bucket(c.PointId),
};
```
