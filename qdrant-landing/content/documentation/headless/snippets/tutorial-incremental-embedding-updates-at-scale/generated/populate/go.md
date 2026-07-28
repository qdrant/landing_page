```go
asPoints := func(chunks []Chunk) []*qdrant.PointStruct {
	points := make([]*qdrant.PointStruct, 0, len(chunks))
	for _, c := range chunks {
		points = append(points, &qdrant.PointStruct{
			Id: qdrant.NewID(c.PointID),
			// embedded by Qdrant Cloud Inference
			Vectors: qdrant.NewVectorsDocument(&qdrant.Document{Text: c.Text, Model: MODEL}),
			Payload: qdrant.NewValueMap(payload(c)),
		})
	}
	return points
}

client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: MAIN,
	Points:         asPoints(prepare(CHUNKS)),
	Wait:           qdrant.PtrOf(true),
})
```
