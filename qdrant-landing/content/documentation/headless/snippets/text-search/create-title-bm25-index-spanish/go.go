package snippet

import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	// @hide-start
	client, err := qdrant.NewClient(&qdrant.Config{
		Host: "localhost",
		Port: 6334,
	})

	if err != nil { panic(err) }
	// @hide-end

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
}
