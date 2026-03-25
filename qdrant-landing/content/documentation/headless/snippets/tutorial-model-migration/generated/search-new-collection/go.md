```go
results, err = client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: NEW_COLLECTION,
	Query: qdrant.NewQueryDocument(&qdrant.Document{
		Text:  "my query",
		Model: NEW_MODEL,
	}),
	Limit: qdrant.PtrOf(uint64(10)),
})
```
