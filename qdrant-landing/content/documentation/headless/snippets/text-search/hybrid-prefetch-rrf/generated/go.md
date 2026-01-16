```go
client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "books",
	Prefetch: []*qdrant.PrefetchQuery{
		{
			Using: qdrant.PtrOf("description-dense"),
			Query: qdrant.NewQueryDocument(&qdrant.Document{
				Text:  "9780553213515",
				Model: "sentence-transformers/all-minilm-l6-v2",
			}),
		},
		{
			Using: qdrant.PtrOf("isbn-bm25"),
			Query: qdrant.NewQueryDocument(&qdrant.Document{
				Text:  "9780553213515",
				Model: "qdrant/bm25",
			}),
		},
	},
	Query:       qdrant.NewQueryFusion(qdrant.Fusion_RRF),
	WithPayload: qdrant.NewWithPayload(true),
	Limit:       qdrant.PtrOf(uint64(10)),
})
```
