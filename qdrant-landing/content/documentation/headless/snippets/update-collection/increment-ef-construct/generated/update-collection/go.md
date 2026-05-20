```go
client.UpdateCollection(context.Background(), &qdrant.UpdateCollection{
	CollectionName: "{collection_name}",
	HnswConfig: &qdrant.HnswConfigDiff{
		EfConstruct: qdrant.PtrOf(baseEf + 1),
	},
})
```
