```go
client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "books",
	Query: qdrant.NewQueryDocument(&qdrant.Document{
		Model: "sentence-transformers/all-minilm-l6-v2",
		Text:  "time travel",
	}),
	Using:       qdrant.PtrOf("description-dense"),
	WithPayload: qdrant.NewWithPayload(true),
	Filter: &qdrant.Filter{
		Must: []*qdrant.Condition{qdrant.NewMatchPhrase("title", "time machine")},
	},
})
```
