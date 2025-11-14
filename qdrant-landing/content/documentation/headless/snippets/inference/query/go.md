```go
import (
	"context"
	"time"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host:   "xyz-example.qdrant.io",
	Port:   6334,
	APIKey: "<paste-your-api-key-here>",
	UseTLS: true,
})

client.Query(ctx, &qdrant.QueryPoints{
	CollectionName: "<your-collection>",
	Query: qdrant.NewQueryNearest(
		qdrant.NewVectorInputDocument(&qdrant.Document{
			Model: "qdrant/bm25",
			Text:  "How to bake cookies?",
		}),
	),
	Using: qdrant.PtrOf("my-bm25-vector"),
})
```