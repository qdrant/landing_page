```go
client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: "books",
	Points: []*qdrant.PointStruct{
		{
			Id: qdrant.NewIDNum(uint64(1)),
			Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{
				"title-bm25": qdrant.NewVectorDocument(&qdrant.Document{
					Model: "qdrant/bm25",
					Text:  "La Máquina del Tiempo",
				}),
			}),
			Payload: qdrant.NewValueMap(map[string]any{
				"title":  "La Máquina del Tiempo",
				"author": "H.G. Wells",
				"isbn":   "9788411486880",
			}),
		},
	},
})
```
