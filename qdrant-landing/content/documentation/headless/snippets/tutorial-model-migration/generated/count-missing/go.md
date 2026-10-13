```go
count, err := client.Count(context.Background(), &qdrant.CountPoints{
	CollectionName: COLLECTION,
	Exact: qdrant.PtrOf(true),
	Filter: &qdrant.Filter{
		MustNot: []*qdrant.Condition{
			qdrant.NewHasVector(NEW_VECTOR),
		},
	},
})
```
