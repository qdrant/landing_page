```go
collectionName := "hybrid-search"

exists, err := client.CollectionExists(context.Background(), collectionName)
if exists {
	client.DeleteCollection(context.Background(), collectionName)
}

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: collectionName,
	VectorsConfig: qdrant.NewVectorsConfigMap(
		map[string]*qdrant.VectorParams{
			"dense": {
				Size:     384,
				Distance: qdrant.Distance_Cosine,
			},
			"multi": {
				Size:     96,
				Distance: qdrant.Distance_Cosine,
				MultivectorConfig: &qdrant.MultiVectorConfig{
					Comparator: qdrant.MultiVectorComparator_MaxSim,
				},
				HnswConfig: &qdrant.HnswConfigDiff{M: qdrant.PtrOf(uint64(0))}, // Disable HNSW for reranking
			},
		},
	),
})

client.CreateFieldIndex(context.Background(), &qdrant.CreateFieldIndexCollection{
	CollectionName: collectionName,
	FieldName:      "description",
	FieldType:      qdrant.FieldType_FieldTypeText.Enum(),
	FieldIndexParams: qdrant.NewPayloadIndexParamsText(
		&qdrant.TextIndexParams{
			Tokenizer: qdrant.TokenizerType_Word,
			Stemmer: qdrant.NewStemmingAlgorithmSnowball(&qdrant.SnowballParams{
				Language: "english",
			}),
			Stopwords: &qdrant.StopwordsSet{
				Languages: []string{"english"},
			},
			// Enable BM25 scoring
			Scoring: &qdrant.TextScoringParams{
				Type: qdrant.TextScoringType_Bm25,
			},
		}),
})
```
