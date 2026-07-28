```go
META := "docs-sync-digests"
N_META := N_BUCKETS / GROUP_SIZE

metaExists, err := client.CollectionExists(context.Background(), META)
if !metaExists {
	client.CreateCollection(context.Background(), &qdrant.CreateCollection{
		CollectionName: META,
		VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
			Size:     1,
			Distance: qdrant.Distance_Cosine,
		}),
	})
}
```
