```go
client, err = qdrant.NewClient(&qdrant.Config{
	Host:   "localhost",
	Port:   6334,
	APIKey: "<your-jwt>",
	UseTLS: true,
})
if err != nil {
	panic(err)
}

_, err = client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: "other_collection",
	Points: []*qdrant.PointStruct{
		{
			Id:      qdrant.NewIDNum(2),
			Vectors: qdrant.NewVectors(0.5, 0.6, 0.7, 0.8),
		},
	},
})
if err != nil {
	fmt.Println(err) // PermissionDenied
}
```
