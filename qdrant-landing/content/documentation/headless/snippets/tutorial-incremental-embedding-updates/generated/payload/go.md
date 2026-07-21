```go
payload := func(c Chunk, lastUpdated string) map[string]any {
	if lastUpdated == "" {
		lastUpdated = time.Now().UTC().Format(time.RFC3339)
	}
	return map[string]any{
		"url":          c.URL,
		"anchor":       c.Anchor,
		"chunk_num":    c.ChunkNum,
		"section_url":  c.SectionURL,
		"text":         c.Text,
		"content_hash": c.ContentHash,
		"last_updated": lastUpdated,
	}
}
```
