```go
collectionName := "hybrid-search"

exists, err := client.CollectionExists(context.Background(), collectionName)
if exists {
	client.DeleteCollection(context.Background(), collectionName)
}

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: collectionName,
	VectorsConfig: qdrant.NewVectorsConfigMap(
		map[string]*qdrant.VectorParams{
			"dense": {
				Size:     384,
				Distance: qdrant.Distance_Cosine,
			},
			"multi": {
				Size:     96,
				Distance: qdrant.Distance_Cosine,
				MultivectorConfig: &qdrant.MultiVectorConfig{
					Comparator: qdrant.MultiVectorComparator_MaxSim,
				},
				HnswConfig: &qdrant.HnswConfigDiff{M: qdrant.PtrOf(uint64(0))}, // Disable HNSW for reranking
			},
		},
	),
	SparseVectorsConfig: qdrant.NewSparseVectorsConfig(
		map[string]*qdrant.SparseVectorParams{
			"sparse": {Modifier: qdrant.Modifier_Idf.Enum()},
		},
	),
})
```
