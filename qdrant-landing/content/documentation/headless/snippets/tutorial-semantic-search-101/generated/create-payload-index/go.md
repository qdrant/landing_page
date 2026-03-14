```go
client.CreateFieldIndex(context.Background(), &qdrant.CreateFieldIndexCollection{
	CollectionName: collectionName,
	FieldName:      "year",
	FieldType:      qdrant.FieldType_FieldTypeInteger.Enum(),
})
```
