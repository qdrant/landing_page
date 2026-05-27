```go
var reEmbedLastOffset *qdrant.PointId
reEmbedBatchSize := uint32(100)
reEmbedReachedEnd := false

for !reEmbedReachedEnd {
	reEmbedScrollResult, err := client.Scroll(context.Background(), &qdrant.ScrollPoints{
		CollectionName: COLLECTION,
		Limit:          qdrant.PtrOf(reEmbedBatchSize),
		Offset:         reEmbedLastOffset,
		WithPayload:    qdrant.NewWithPayload(true),
		WithVectors:    qdrant.NewWithVectors(false),
	})

	reEmbedRecords := reEmbedScrollResult

	pointVectors := make([]*qdrant.PointVectors, len(reEmbedRecords))
	for idx, record := range reEmbedRecords {
		text := ""
		if val, ok := record.Payload["text"]; ok {
			text = val.GetStringValue()
		}

		// Update only the new vector on each point; the old vector and payload are untouched
		pointVectors[idx] = &qdrant.PointVectors{
			Id: record.Id,
			Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{
				NEW_VECTOR: qdrant.NewVectorDocument(&qdrant.Document{
					Text:  text,
					Model: NEW_MODEL,
				}),
			}),
		}
	}

	client.UpdateVectors(context.Background(), &qdrant.UpdatePointVectors{
		CollectionName: COLLECTION,
		Points:         pointVectors,
	})

	reEmbedReachedEnd = (reEmbedLastOffset == nil)
}
```
