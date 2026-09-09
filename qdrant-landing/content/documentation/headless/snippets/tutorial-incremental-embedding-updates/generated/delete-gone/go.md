```go
// remove every point the current crawl no longer contains, return how many
deleteGone := func(incomingIDs map[string]Chunk) int {
	if len(incomingIDs) == 0 {
		panic("Refusing to delete from an empty source snapshot.")
	}

	ids := make([]*qdrant.PointId, 0, len(incomingIDs))
	for pid := range incomingIDs {
		ids = append(ids, qdrant.NewID(pid))
	}
	stale := &qdrant.Filter{
		MustNot: []*qdrant.Condition{qdrant.NewHasID(ids...)},
	}

	toDelete, err := client.Count(context.Background(), &qdrant.CountPoints{
		CollectionName: COLLECTION,
		Filter:         stale,
	})

	// potential check against a threshold to avoid accidental mass deletion could be added here
	client.Delete(context.Background(), &qdrant.DeletePoints{
		CollectionName: COLLECTION,
		Points:         qdrant.NewPointsSelectorFilter(stale),
		Wait:           qdrant.PtrOf(true),
	})
	return int(toDelete)
}
```
