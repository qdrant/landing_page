```go
client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: OLD_COLLECTION,
	Points: []*qdrant.PointStruct{
		{
			Id: qdrant.NewIDNum(1),
			Vectors: qdrant.NewVectorsDocument(&qdrant.Document{
				Text:  "Example document",
				Model: OLD_MODEL,
			}),
			Payload: qdrant.NewValueMap(map[string]any{"text": "Example document"}),
		},
	},
})
```
