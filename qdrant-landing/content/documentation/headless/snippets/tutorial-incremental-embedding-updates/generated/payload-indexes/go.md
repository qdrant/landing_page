```go
for _, field := range []string{"content_hash", "url", "section_url"} {
	client.CreateFieldIndex(context.Background(), &qdrant.CreateFieldIndexCollection{
		CollectionName: COLLECTION,
		FieldName:      field,
		FieldType:      qdrant.FieldType_FieldTypeKeyword.Enum(),
	})
}
```
