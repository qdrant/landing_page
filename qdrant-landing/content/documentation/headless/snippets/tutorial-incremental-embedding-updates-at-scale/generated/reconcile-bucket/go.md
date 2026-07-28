```go
// Make bucket b in Qdrant match sourceChunks. Returns (added, reEmbedded, deleted).
reconcileBucket := func(b int, sourceChunks map[string]Chunk) (int, int, int) {
	stored := readBucket(b) // point ID -> content hash currently in Qdrant

	var toWrite []Chunk // new or content-changed chunks: embed and upsert
	added, reEmbedded := 0, 0
	for pid, chunk := range sourceChunks {
		storedHash, found := stored[pid]
		if !found {
			toWrite = append(toWrite, chunk) // new chunk in this bucket
			added++
		} else if storedHash != chunk.ContentHash {
			toWrite = append(toWrite, chunk) // same chunk, changed text
			reEmbedded++
		}
	}

	var toDelete []*qdrant.PointId // chunks Qdrant has but the source no longer does
	for pid := range stored {
		if _, found := sourceChunks[pid]; !found {
			toDelete = append(toDelete, qdrant.NewID(pid))
		}
	}

	if len(toWrite) > 0 {
		client.Upsert(context.Background(), &qdrant.UpsertPoints{
			CollectionName: MAIN,
			Points:         asPoints(toWrite),
			Wait:           qdrant.PtrOf(true),
		})
	}
	if len(toDelete) > 0 {
		client.Delete(context.Background(), &qdrant.DeletePoints{
			CollectionName: MAIN,
			Points:         qdrant.NewPointsSelectorIDs(toDelete),
			Wait:           qdrant.PtrOf(true),
		})
	}

	return added, reEmbedded, len(toDelete)
}
```
