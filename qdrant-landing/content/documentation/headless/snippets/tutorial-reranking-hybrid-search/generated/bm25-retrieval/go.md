```go
results, err = client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: collectionName,
	Query: qdrant.NewQueryText(&qdrant.TextQuery{Query: query}),
	Using: qdrant.PtrOf("description"),
	Limit: qdrant.PtrOf(uint64(10)),
})

for _, result := range results {
	fmt.Println(result)
}
```
