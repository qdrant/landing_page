```go
oldVectorResults, err := client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: COLLECTION,
	Query: qdrant.NewQueryDocument(&qdrant.Document{
		Text:  "my query",
		Model: OLD_MODEL,
	}),
	Using: qdrant.PtrOf(OLD_VECTOR),
	Limit: qdrant.PtrOf(uint64(10)),
})
```
