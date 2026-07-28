```go
contentHash := func(text string) string {
	sum := sha256.Sum256([]byte(text))
	return hex.EncodeToString(sum[:])
}

pointID := func(url, anchor string, num int) string {
	// NewSHA1 with a namespace is UUIDv5; NameSpaceURL is a fixed constant it requires,
	// marking the input as a URL-like name
	return uuid.NewSHA1(uuid.NameSpaceURL, []byte(fmt.Sprintf("%s#%s::%d", url, anchor, num))).String()
}

// Attach the derived values every later step depends on.
prepare := func(chunks []Chunk) []Chunk {
	out := make([]Chunk, 0, len(chunks))
	for _, c := range chunks {
		// Run c.Text through your normalization pass before hashing it.
		c.SectionURL = c.URL
		if c.Anchor != "" {
			c.SectionURL = c.URL + "#" + c.Anchor
		}
		c.ContentHash = contentHash(c.Text)
		c.PointID = pointID(c.URL, c.Anchor, c.ChunkNum)
		out = append(out, c)
	}
	return out
}
```
