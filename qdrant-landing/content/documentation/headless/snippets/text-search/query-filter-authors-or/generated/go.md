```go
orFilter := qdrant.Filter{
	Should: []*qdrant.Condition{
		qdrant.NewMatch("author", "Larry Niven"),
		qdrant.NewMatch("author", "Jerry Pournelle"),
	},
}

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "books",
	Query: qdrant.NewQueryNearest(
		qdrant.NewVectorInputDocument(&qdrant.Document{
			Model: "sentence-transformers/all-minilm-l6-v2",
			Text:  "space opera",
		}),
	),
	Using:       qdrant.PtrOf("description-dense"),
	WithPayload: qdrant.NewWithPayload(true),
	Filter:      &orFilter,
})
```
