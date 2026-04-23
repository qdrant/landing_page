```go
collectionName := "my_collection"

exists, err := client.CollectionExists(context.Background(), collectionName)
if exists {
	client.DeleteCollection(context.Background(), collectionName)
}

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: collectionName,
	VectorsConfig: qdrant.NewVectorsConfigMap(
		map[string]*qdrant.VectorParams{
			"dense_vector": {
				Size:     384,
				Distance: qdrant.Distance_Cosine,
			},
		},
	),
	ShardingMethod: qdrant.ShardingMethod_Custom.Enum(),
})
```
