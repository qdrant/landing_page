```go
payload := func(c Chunk) map[string]any {
	return map[string]any{
		"url":          c.URL,
		"anchor":       c.Anchor,
		"chunk_num":    c.ChunkNum,
		"section_url":  c.SectionURL,
		"text":         c.Text,
		"content_hash": c.ContentHash,
		"sync_bucket":  bucket(c.PointID),
	}
}
```
