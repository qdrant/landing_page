```go
client.CreateVectorName(context.Background(), &qdrant.CreateVectorNameRequest{
	CollectionName: COLLECTION,
	VectorName:     NEW_VECTOR,
	VectorConfig: &qdrant.CreateVectorNameRequest_DenseConfig{
		DenseConfig: &qdrant.DenseVectorCreationConfig{
			Size:     512, // Size of the new embedding vectors
			Distance: qdrant.Distance_Cosine,
		},
	},
})
```
