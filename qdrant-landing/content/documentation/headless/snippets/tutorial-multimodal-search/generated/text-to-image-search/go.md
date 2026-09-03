```go
results, err := client.Query(ctx, &qdrant.QueryPoints{
	CollectionName: collectionName,
	Query: qdrant.NewQueryNearest(
		qdrant.NewVectorInputDocument(&qdrant.Document{
			Text:  "Plane components",
			Model: "cohere/embed-v4.0",
			Options: qdrant.NewValueMap(map[string]any{
				"output_dimension": 512,
			}),
		}),
	),
	Using:       qdrant.PtrOf("image"),
	WithPayload: qdrant.NewWithPayloadInclude("image"),
	Limit:       qdrant.PtrOf(uint64(1)),
})

fmt.Println(results[0].Payload["image"])
```
