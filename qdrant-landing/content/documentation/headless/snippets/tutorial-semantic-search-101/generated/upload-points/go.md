```go
embeddingModel := "sentence-transformers/all-minilm-l6-v2"

points := make([]*qdrant.PointStruct, len(documents))
for idx, doc := range documents {
	points[idx] = &qdrant.PointStruct{
		Id: qdrant.NewIDNum(uint64(idx)),
		Vectors: qdrant.NewVectorsDocument(&qdrant.Document{
			Text:  doc["description"].(string),
			Model: embeddingModel,
		}),
		Payload: qdrant.NewValueMap(doc),
	}
}

client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: collectionName,
	Points:         points,
})
```
