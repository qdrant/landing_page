```go
MODEL := "sentence-transformers/all-MiniLM-L6-v2"
PIPELINE := "docs-prep-pipeline-v1"
COLLECTION := "docs-sync-tutorial"

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: COLLECTION,
	VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
		Size:     384, // all-MiniLM-L6-v2 output dimension
		Distance: qdrant.Distance_Cosine,
	}),
	Metadata: qdrant.NewValueMap(map[string]any{
		"embedding_model":  MODEL,
		"pipeline_version": PIPELINE,
	}),
})
```
