```go
QUERY := "Where exactly to set `QDRANT__SERVICE__API_KEY` variable to enable authentication for a self-hosted Qdrant?"

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: COLLECTION,
	Query:          qdrant.NewQueryDocument(&qdrant.Document{Text: QUERY, Model: MODEL}),
	Limit:          qdrant.PtrOf(uint64(3)),
	WithPayload:    qdrant.NewWithPayloadInclude("section_url", "text"),
})
```
