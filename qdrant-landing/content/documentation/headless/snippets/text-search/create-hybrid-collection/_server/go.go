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

	if err != nil {
		panic(err)
	}
	// @hide-end

	client.CreateCollection(context.Background(), &qdrant.CreateCollection{
		CollectionName: "books",
		VectorsConfig: qdrant.NewVectorsConfigMap(
			map[string]*qdrant.VectorParams{
				"description-dense": {Size: 384, Distance: qdrant.Distance_Cosine},
			}),
	})

	client.CreateFieldIndex(context.Background(), &qdrant.CreateFieldIndexCollection{
		CollectionName: "books",
		FieldName:      "title",
		FieldType:      qdrant.FieldType_FieldTypeText.Enum(),
		FieldIndexParams: qdrant.NewPayloadIndexParamsText(
			&qdrant.TextIndexParams{
				Tokenizer: qdrant.TokenizerType_Word,
				Scoring: &qdrant.TextScoringParams{
					Type: qdrant.TextScoringType_Bm25,
				},
			}),
	})
}
