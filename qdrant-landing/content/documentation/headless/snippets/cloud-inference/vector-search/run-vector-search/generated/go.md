```go
prefetch := []*qdrant.PrefetchQuery{
	{
		Query: qdrant.NewQueryDocument(&qdrant.Document{
			Text:  queryText,
			Model: bm25Model,
		}),
		Using: qdrant.PtrOf("bm25_sparse_vector"),
	},
	{
		Query: qdrant.NewQueryDocument(&qdrant.Document{
			Text:  queryText,
			Model: denseModel,
		}),
		Using: qdrant.PtrOf("dense_vector"),
	},
}

client.Query(ctx, &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Prefetch:       prefetch,
	Query:          qdrant.NewQueryFusion(qdrant.Fusion_RRF),
})
```
