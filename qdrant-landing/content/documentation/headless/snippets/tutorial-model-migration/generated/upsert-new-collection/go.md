```go
client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: NEW_COLLECTION,
	Points: []*qdrant.PointStruct{
		{
			Id: qdrant.NewIDNum(1),
			// Use the new embedding model to encode the document
			Vectors: qdrant.NewVectorsDocument(&qdrant.Document{
				Text:  "Example document",
				Model: NEW_MODEL,
			}),
			Payload: qdrant.NewValueMap(map[string]any{"text": "Example document"}),
		},
	},
})
```
