```go
var lastOffset *qdrant.PointId
batchSize := uint32(100) // Number of points to read in each batch
reachedEnd := false

for !reachedEnd {
	// Get the next batch of points from the old collection
	scrollResult, err := client.Scroll(context.Background(), &qdrant.ScrollPoints{
		CollectionName: OLD_COLLECTION,
		Limit:          qdrant.PtrOf(batchSize),
		Offset:         lastOffset,
		// Include payloads in the response, as we need them to re-embed the vectors
		WithPayload: qdrant.NewWithPayload(true),
		// We don't need the old vectors, so let's save on the bandwidth
		WithVectors: qdrant.NewWithVectors(false),
	})

	records := scrollResult

	// Re-embed the points using the new model
	points := make([]*qdrant.PointStruct, len(records))
	for idx, record := range records {
		text := ""
		if val, ok := record.Payload["text"]; ok {
			text = val.GetStringValue()
		}

		points[idx] = &qdrant.PointStruct{
			// Keep the original ID to ensure consistency
			Id: record.Id,
			// Use the new embedding model to encode the text from the payload,
			// assuming that was the original source of the embedding
			Vectors: qdrant.NewVectorsDocument(&qdrant.Document{
				Text:  text,
				Model: NEW_MODEL,
			}),
			// Keep the original payload
			Payload: record.Payload,
		}
	}

	// Upsert the re-embedded points into the new collection
	client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: NEW_COLLECTION,
		Points:         points,
		// Only insert the point if a point with this ID does not already exist.
		UpdateMode: qdrant.UpdateMode_InsertOnly.Enum(),
	})

	// Check if we reached the end of the collection
	reachedEnd = (lastOffset == nil)
}
```
