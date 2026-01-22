```go
client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: "books",
	VectorsConfig: qdrant.NewVectorsConfigMap(
		map[string]*qdrant.VectorParams{
			"description-dense": {
				Size:     384,
				Distance: qdrant.Distance_Cosine,
			},
		}),
})
```
