```go
cohereApiKey := os.Getenv("COHERE_API_KEY")
ctx := qdrant.WithHeader(context.Background(), "cohere-api-key", cohereApiKey)

points := make([]*qdrant.PointStruct, len(documents))
for idx, doc := range documents {
	imageUrl, err := imageToBase64Url(doc.Image)

	points[idx] = &qdrant.PointStruct{
		Id: qdrant.NewIDNum(uint64(idx)),
		Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{
			"text": qdrant.NewVectorDocument(&qdrant.Document{
				Text:  doc.Caption,
				Model: "cohere/embed-v4.0",
				Options: qdrant.NewValueMap(map[string]any{
					"output_dimension": 512,
				}),
			}),
			"image": qdrant.NewVectorImage(&qdrant.Image{
				Image: qdrant.NewValueString(imageUrl),
				Model: "cohere/embed-v4.0",
				Options: qdrant.NewValueMap(map[string]any{
					"output_dimension": 512,
				}),
			}),
		}),
		Payload: qdrant.NewValueMap(map[string]any{
			"caption": doc.Caption,
			"image":   doc.Image,
		}),
	}
}

client.Upsert(ctx, &qdrant.UpsertPoints{
	CollectionName: collectionName,
	Points:         points,
})
```
