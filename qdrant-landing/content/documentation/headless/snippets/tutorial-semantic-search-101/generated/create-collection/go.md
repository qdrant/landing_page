```go
collectionName := "my_books"

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: collectionName,
	VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
		Size:     384, // Vector size is defined by used model
		Distance: qdrant.Distance_Cosine,
	}),
})
```
