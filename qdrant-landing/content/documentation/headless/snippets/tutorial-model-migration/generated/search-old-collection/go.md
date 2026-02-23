```go
results, err := client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: OLD_COLLECTION,
	Query: qdrant.NewQueryDocument(&qdrant.Document{
		Text:  "my query",
		Model: OLD_MODEL,
	}),
	Limit: qdrant.PtrOf(uint64(10)),
})
```
