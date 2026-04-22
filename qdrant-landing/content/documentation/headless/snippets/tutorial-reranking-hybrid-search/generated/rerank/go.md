```go
results, err = client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: collectionName,
	Prefetch: []*qdrant.PrefetchQuery{
		{
			Query: qdrant.NewQueryDocument(&qdrant.Document{
				Text:  query,
				Model: denseEmbeddingModel,
			}),
			Using: qdrant.PtrOf("dense"),
			Limit: qdrant.PtrOf(uint64(20)),
		},
		{
			Query: qdrant.NewQueryDocument(&qdrant.Document{
				Text:  query,
				Model: sparseEmbeddingModel,
			}),
			Using: qdrant.PtrOf("sparse"),
			Limit: qdrant.PtrOf(uint64(20)),
		},
	},
	Query: qdrant.NewQueryDocument(&qdrant.Document{
		Text:  query,
		Model: lateInteractionEmbeddingModel,
	}),
	Using:       qdrant.PtrOf("multi"),
	WithPayload: qdrant.NewWithPayload(true),
	Limit:       qdrant.PtrOf(uint64(10)),
})

for _, result := range results {
	fmt.Println(result)
}
```
