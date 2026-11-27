```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant/serverless"
)

client.CreateCollection(context.Background(), "menu", &serverless.CollectionConfig{
	DenseVectors: map[string]*serverless.DenseVectorConfig{
		"dense": {Size: 384, Distance: serverless.Distance_COSINE},
	},
	PayloadIndexes: map[string]*serverless.PayloadIndexConfig{
		"description": serverless.NewPayloadIndexConfigText(&serverless.TextIndex{
			Tokenizer: serverless.Tokenizer_WORD.Enum(),
			Stopwords: &serverless.StopwordsSet{Languages: []string{"english"}},
			Scoring:   &serverless.TextScoringParams{Type: serverless.TextScoringType_BM25.Enum()},
		}),
	},
})
```
