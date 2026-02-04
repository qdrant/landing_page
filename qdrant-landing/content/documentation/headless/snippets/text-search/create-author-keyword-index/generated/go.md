```go
client.CreateFieldIndex(context.Background(), &qdrant.CreateFieldIndexCollection{
	CollectionName: "books",
	FieldName:      "author",
	FieldType:      qdrant.FieldType_FieldTypeKeyword.Enum(),
})
```
