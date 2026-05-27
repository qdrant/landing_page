```go
client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: COLLECTION,
	Points: []*qdrant.PointStruct{
		{
			Id: qdrant.NewIDNum(1),
			Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{
				OLD_VECTOR: qdrant.NewVectorDocument(&qdrant.Document{
					Text:  "Example document",
					Model: OLD_MODEL,
				}),
				NEW_VECTOR: qdrant.NewVectorDocument(&qdrant.Document{
					Text:  "Example document",
					Model: NEW_MODEL,
				}),
			}),
			Payload: qdrant.NewValueMap(map[string]any{"text": "Example document"}),
		},
	},
})
```
