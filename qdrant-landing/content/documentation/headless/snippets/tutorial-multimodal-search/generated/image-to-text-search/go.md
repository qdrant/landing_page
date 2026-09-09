```go
queryImageUrl, err := imageToBase64Url("images/image-2.png")

results, err = client.Query(ctx, &qdrant.QueryPoints{
	CollectionName: collectionName,
	Query: qdrant.NewQueryNearest(
		qdrant.NewVectorInputImage(&qdrant.Image{
			Image: qdrant.NewValueString(queryImageUrl),
			Model: "cohere/embed-v4.0",
			Options: qdrant.NewValueMap(map[string]any{
				"output_dimension": 512,
			}),
		}),
	),
	Using:       qdrant.PtrOf("text"),
	WithPayload: qdrant.NewWithPayloadInclude("caption"),
	Limit:       qdrant.PtrOf(uint64(1)),
})

fmt.Println(results[0].Payload["caption"])
```
