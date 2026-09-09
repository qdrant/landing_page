```csharp
Dictionary<string, Value> Payload(Chunk chunk, string? lastUpdated = null) => new()
{
	["url"] = chunk.Url,
	["anchor"] = chunk.Anchor,
	["chunk_num"] = chunk.ChunkNum,
	["section_url"] = chunk.SectionUrl,
	["text"] = chunk.Text,
	["content_hash"] = chunk.ContentHash,
	["last_updated"] = lastUpdated ?? DateTimeOffset.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssK"),
};
```
