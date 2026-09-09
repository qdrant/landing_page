```go
var points []*qdrant.PointStruct
for _, c := range prepareChunksForSync(CHUNKS) {
	points = append(points, &qdrant.PointStruct{
		Id: qdrant.NewID(c.PointID),

		Vectors: qdrant.NewVectorsDocument(&qdrant.Document{Text: c.Text, Model: MODEL}),
		Payload: qdrant.NewValueMap(payload(c, "")),
	})
}
client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: COLLECTION,
	Points:         points,
	Wait:           qdrant.PtrOf(true),
})
```
