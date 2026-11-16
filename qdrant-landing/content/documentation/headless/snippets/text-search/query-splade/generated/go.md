```go
client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "books",
	Query: qdrant.NewQueryDocument(&qdrant.Document{
		Model: "prithivida/splade_pp_en_v1",
		Text:  "time travel",
	}),
	Using:       qdrant.PtrOf("title-splade"),
	WithPayload: qdrant.NewWithPayload(true),
	Limit:       qdrant.PtrOf(uint64(10)),
})
```
