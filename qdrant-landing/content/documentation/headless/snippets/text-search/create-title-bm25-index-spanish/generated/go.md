```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.CreateFieldIndex(context.Background(), &qdrant.CreateFieldIndexCollection{
	CollectionName: "books",
	FieldName:      "title",
	FieldType:      qdrant.FieldType_FieldTypeText.Enum(),
	FieldIndexParams: qdrant.NewPayloadIndexParamsText(
		&qdrant.TextIndexParams{
			Tokenizer: qdrant.TokenizerType_Word,
			Stemmer: qdrant.NewStemmingAlgorithmSnowball(&qdrant.SnowballParams{
				Language: "spanish",
			}),
			Stopwords: &qdrant.StopwordsSet{
				Languages: []string{"spanish"},
			},
			Scoring: &qdrant.TextScoringParams{
				Type: qdrant.TextScoringType_Bm25,
			},
		}),
})
```
