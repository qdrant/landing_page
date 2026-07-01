```go
collectionInfo, err := client.GetCollectionInfo(context.Background(), "{collection_name}")
if err != nil { panic(err) }
baseEf := *collectionInfo.Config.HnswConfig.EfConstruct
```
