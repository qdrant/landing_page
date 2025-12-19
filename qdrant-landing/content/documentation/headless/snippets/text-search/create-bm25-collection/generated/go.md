```go
client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: "books",
	SparseVectorsConfig: qdrant.NewSparseVectorsConfig(
		map[string]*qdrant.SparseVectorParams{
			"title-bm25": { Modifier: qdrant.Modifier_Idf.Enum() },
		}),
})
```
