```go
client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "books",
	Query: qdrant.NewQueryNearest(
		qdrant.NewVectorInputDocument(&qdrant.Document{
			Model:   "qdrant/bm25",
			Text:    "tiempo",
			Options: qdrant.NewValueMap(map[string]any{"language": "spanish"}),
		}),
	),
	Using:       qdrant.PtrOf("title-bm25"),
	WithPayload: qdrant.NewWithPayload(true),
	Limit:       qdrant.PtrOf(uint64(10)),
})
```
