```go
client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "books",
	Query: qdrant.NewQueryNearest(
		qdrant.NewVectorInputDocument(&qdrant.Document{
			Model:   "qdrant/bm25",
			Text:    "time travel",
			Options: qdrant.NewValueMap(map[string]any{"avg_len": 5.0}),
		}),
	),
	Using:       qdrant.PtrOf("title-bm25"),
	WithPayload: qdrant.NewWithPayload(true),
	Limit:       qdrant.PtrOf(uint64(10)),
})
```
