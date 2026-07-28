```go
MAIN := "docs-sync-scale"
MODEL := "sentence-transformers/all-MiniLM-L6-v2"

mainExists, err := client.CollectionExists(context.Background(), MAIN)
if !mainExists {
	client.CreateCollection(context.Background(), &qdrant.CreateCollection{
		CollectionName: MAIN,
		VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
			Size:     384,
			Distance: qdrant.Distance_Cosine,
		}),
		Metadata: qdrant.NewValueMap(map[string]any{
			"embedding_model":  MODEL,
			"pipeline_version": "1",
		}),
	})
	client.CreateFieldIndex(context.Background(), &qdrant.CreateFieldIndexCollection{
		CollectionName: MAIN,
		FieldName:      "sync_bucket",
		FieldType:      qdrant.FieldType_FieldTypeInteger.Enum(),
	})
}
```
