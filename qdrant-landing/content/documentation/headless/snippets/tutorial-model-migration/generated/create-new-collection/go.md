```go
client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: NEW_COLLECTION,
	VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
		Size:     512, // Size of the new embedding vectors
		Distance: qdrant.Distance_Cosine,
	}),
})
```
