```go
client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: collectionName,
	Points: []*qdrant.PointStruct{
		{
			Id: qdrant.NewID(uuid.New().String()),
			Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{
				"dense_vector": qdrant.NewVectorDocument(&qdrant.Document{
					Text:  "The best way to start a Wednesday is with a cup of coffee",
					Model: denseModel,
				}),
			}),
			Payload: qdrant.NewValueMap(map[string]any{
				"text":     "The best way to start a Wednesday is with a cup of coffee",
				"datetime": "2026-04-08T07:57:47",
			}),
		},
	},
	ShardKeySelector: &qdrant.ShardKeySelector{
		ShardKeys: []*qdrant.ShardKey{qdrant.NewShardKey(today)},
	},
})
```
