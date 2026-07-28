```go
// Return a map of point ID to content hash for every chunk stored in bucket b.
// Pages through the results so nothing is missed in a large bucket.
readBucket := func(b int) map[string]string {
	stored := make(map[string]string)
	var offset *qdrant.PointId
	for {
		points, next, err := client.ScrollAndOffset(context.Background(), &qdrant.ScrollPoints{
			CollectionName: MAIN,
			Filter: &qdrant.Filter{
				Must: []*qdrant.Condition{qdrant.NewMatchInt("sync_bucket", int64(b))},
			},
			WithPayload: qdrant.NewWithPayloadInclude("content_hash"),
			WithVectors: qdrant.NewWithVectors(false),
			Limit:       qdrant.PtrOf(uint32(1000)),
			Offset:      offset,
		})

		for _, point := range points {
			stored[point.GetId().GetUuid()] = point.GetPayload()["content_hash"].GetStringValue()
		}
		if next == nil {
			return stored
		}
		offset = next
	}
}
```
