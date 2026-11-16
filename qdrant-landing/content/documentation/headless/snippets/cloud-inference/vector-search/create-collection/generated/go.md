```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.CreateCollection(context.Background(), &qdrant.CreateCollection{
	CollectionName: "{collection_name}",
	VectorsConfig: qdrant.NewVectorsConfigMap(
		map[string]*qdrant.VectorParams{
			"dense_vector": {
				Size:     384,
				Distance: qdrant.Distance_Cosine,
			},
		}),
})

client.CreateFieldIndex(context.Background(), &qdrant.CreateFieldIndexCollection{
	CollectionName: "{collection_name}",
	FieldName:      "passage_text",
	FieldType:      qdrant.FieldType_FieldTypeText.Enum(),
	FieldIndexParams: qdrant.NewPayloadIndexParamsText(
		&qdrant.TextIndexParams{
			Tokenizer: qdrant.TokenizerType_Word,
			// Enable BM25 scoring
			Scoring: &qdrant.TextScoringParams{
				Type: qdrant.TextScoringType_Bm25,
			},
		}),
})
```
