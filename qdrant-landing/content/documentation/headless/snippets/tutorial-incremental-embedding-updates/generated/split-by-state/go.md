```go
// compare the incoming chunk list to the collection: who is unchanged, changed, or unknown
splitByState := func(latestChunks []Chunk) (map[string]Chunk, []Chunk, []Chunk, []Chunk) {
	incoming := make(map[string]Chunk, len(latestChunks))
	ids := make([]*qdrant.PointId, 0, len(latestChunks))
	for _, c := range latestChunks {
		incoming[c.PointID] = c
		ids = append(ids, qdrant.NewID(c.PointID))
	}

	retrieved, err := client.Get(context.Background(), &qdrant.GetPoints{
		CollectionName: COLLECTION,
		Ids:            ids,
		WithPayload:    qdrant.NewWithPayloadInclude("content_hash"),
		WithVectors:    qdrant.NewWithVectors(false),
	})
	stored := make(map[string]string, len(retrieved))
	for _, p := range retrieved {
		stored[p.GetId().GetUuid()] = p.GetPayload()["content_hash"].GetStringValue()
	}

	var unchanged, contentChanged, unknownIDs []Chunk
	for pid, c := range incoming {
		storedHash, found := stored[pid]
		switch {
		case found && storedHash == c.ContentHash:
			unchanged = append(unchanged, c)
		case found:
			contentChanged = append(contentChanged, c)
		default:
			unknownIDs = append(unknownIDs, c)
		}
	}

	return incoming, unchanged, contentChanged, unknownIDs
}

incomingIDs, unchanged, contentChanged, unknownIDs := splitByState(LATEST_CHUNKS)
```
