```go
sync := func(latestChunks []Chunk) map[string]int {
	checkGate() // refuse to mix embedding models or pipeline versions

	chunks := prepareChunksForSync(latestChunks)
	incomingIDs, unchanged, contentChanged, unknownIDs := splitByState(chunks)

	reEmbedChanged(contentChanged)
	reused, added := reuseOrAdd(unknownIDs)
	deleted := deleteGone(incomingIDs)

	return map[string]int{
		"unchanged":        len(unchanged),
		"re-embedded":      len(contentChanged),
		"reused_embedding": reused,
		"added":            added,
		"deleted":          deleted,
	}
}
```
