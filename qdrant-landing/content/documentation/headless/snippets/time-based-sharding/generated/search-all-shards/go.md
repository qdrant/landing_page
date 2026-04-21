```go
result, err = client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: collectionName,
	Query:          qdrant.NewQueryDocument(&qdrant.Document{Text: queryText, Model: denseModel}),
	Using:          qdrant.PtrOf("dense_vector"),
	Limit:          qdrant.PtrOf(uint64(5)),
})

for _, hit := range result {
	fmt.Println(hit)
}
```
