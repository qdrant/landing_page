```go
queryResult, err := client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: collectionName,
	Query: qdrant.NewQueryDocument(&qdrant.Document{
		Text:  "alien invasion",
		Model: embeddingModel,
	}),
	Limit: qdrant.PtrOf(uint64(3)),
})

for _, hit := range queryResult {
	fmt.Println(hit.Payload, "score:", hit.Score)
}
```
