```go
client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: "books",
	VectorsConfig: qdrant.NewVectorsConfigMap(
		map[string]*qdrant.VectorParams{
			"description-dense": { Size: 384, Distance: qdrant.Distance_Cosine },
		}),
	SparseVectorsConfig: qdrant.NewSparseVectorsConfig(
		map[string]*qdrant.SparseVectorParams{
			"isbn-bm25": { Modifier: qdrant.Modifier_Idf.Enum() },
		}),
})
```
