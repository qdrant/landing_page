```go
reEmbedChanged := func(contentChanged []Chunk) {
	if len(contentChanged) == 0 {
		return
	}
	points := make([]*qdrant.PointStruct, 0, len(contentChanged))
	for _, c := range contentChanged {
		points = append(points, &qdrant.PointStruct{
			Id:      qdrant.NewID(c.PointID),
			Vectors: qdrant.NewVectorsDocument(&qdrant.Document{Text: c.Text, Model: MODEL}),
			Payload: qdrant.NewValueMap(payload(c, "")),
		})
	}
	client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: COLLECTION,
		Points:         points,
		Wait:           qdrant.PtrOf(true),
	})
}
```
