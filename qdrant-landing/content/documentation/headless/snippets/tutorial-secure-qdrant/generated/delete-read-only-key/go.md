```go
client, err = qdrant.NewClient(&qdrant.Config{
	Host:   "localhost",
	Port:   6334,
	APIKey: "my-read-only-key",
	UseTLS: true,
})
if err != nil {
	panic(err)
}

_, err = client.Delete(context.Background(), &qdrant.DeletePoints{
	CollectionName: "my_collection",
	Points:         qdrant.NewPointsSelector(qdrant.NewIDNum(1)),
})
if err != nil {
	fmt.Println(err) // PermissionDenied
}
```
