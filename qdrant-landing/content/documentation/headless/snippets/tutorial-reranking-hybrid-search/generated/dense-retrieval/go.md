```go
query := "time travel"

results, err := client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: collectionName,
	Query: qdrant.NewQueryDocument(&qdrant.Document{
		Text:  query,
		Model: denseEmbeddingModel,
	}),
	Using: qdrant.PtrOf("dense"),
	Limit: qdrant.PtrOf(uint64(10)),
})

for _, result := range results {
	fmt.Println(result)
}
```
