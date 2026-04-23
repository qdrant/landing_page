```go
today := "2026-04-08"
t, _ := time.Parse("2006-01-02", today)
oldestShardKey := t.AddDate(0, 0, -7).Format("2006-01-02")

client.CreateShardKey(context.Background(), collectionName, &qdrant.CreateShardKey{
	ShardKey: qdrant.NewShardKey(today),
})
client.DeleteShardKey(context.Background(), collectionName, &qdrant.DeleteShardKey{
	ShardKey: qdrant.NewShardKey(oldestShardKey),
})
```
