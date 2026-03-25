```go
queryResultFiltered, err := client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: collectionName,
	Query: qdrant.NewQueryDocument(&qdrant.Document{
		Text:  "alien invasion",
		Model: embeddingModel,
	}),
	Filter: &qdrant.Filter{
		Must: []*qdrant.Condition{
			qdrant.NewRange("year", &qdrant.Range{
				Gte: qdrant.PtrOf(2000.0),
			}),
		},
	},
	Limit: qdrant.PtrOf(uint64(1)),
})

for _, hit := range queryResultFiltered {
	fmt.Println(hit.Payload, "score:", hit.Score)
}
```
