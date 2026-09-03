```go
collectionName := "multimodal-embeddings"

exists, err := client.CollectionExists(context.Background(), collectionName)
if !exists {
	client.CreateCollection(context.Background(), &qdrant.CreateCollection{
		CollectionName: collectionName,
		VectorsConfig: qdrant.NewVectorsConfigMap(
			map[string]*qdrant.VectorParams{
				"image": {
					Size:     512,
					Distance: qdrant.Distance_Cosine,
				},
				"text": {
					Size:     512,
					Distance: qdrant.Distance_Cosine,
				},
			},
		),
	})
}
```
