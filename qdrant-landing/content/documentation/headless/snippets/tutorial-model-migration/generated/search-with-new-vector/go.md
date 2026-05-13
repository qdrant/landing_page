```go
newVectorResults, err := client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: COLLECTION,
	Query: qdrant.NewQueryDocument(&qdrant.Document{
		Text:  "my query",
		Model: NEW_MODEL,
	}),
	Using: qdrant.PtrOf(NEW_VECTOR),
	Limit: qdrant.PtrOf(uint64(10)),
})
```
