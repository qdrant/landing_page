```go
results, err = client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: collectionName,
	Query: qdrant.NewQueryDocument(&qdrant.Document{
		Text:  query,
		Model: sparseEmbeddingModel,
	}),
	Using: qdrant.PtrOf("sparse"),
	Limit: qdrant.PtrOf(uint64(10)),
})

for _, result := range results {
	fmt.Println(result)
}
```
