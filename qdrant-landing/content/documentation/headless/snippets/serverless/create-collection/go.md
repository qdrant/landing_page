```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant/serverless"
)

client.CreateCollection(context.Background(), "products", &serverless.CollectionConfig{
	DenseVectors: map[string]*serverless.DenseVectorConfig{
		"dense": {
			Size:          1536,
			Distance:      serverless.Distance_COSINE,
			PrecisionTier: serverless.PrecisionTier_MEDIUM.Enum(),
		},
	},
	SparseVectors: map[string]*serverless.SparseVectorConfig{
		"bm25": {UseIdf: true},
	},
	PayloadIndexes: map[string]*serverless.PayloadIndexConfig{
		"category": serverless.NewPayloadIndexConfigKeyword(nil),
		"price":    serverless.NewPayloadIndexConfigFloat(nil),
	},
})
```
