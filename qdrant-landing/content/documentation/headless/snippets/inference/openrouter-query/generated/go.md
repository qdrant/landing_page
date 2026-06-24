```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

ctx := qdrant.WithHeader(context.Background(), "openrouter-api-key", "<YOUR_OPENROUTER_API_KEY>")

client.Query(ctx, &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Query: qdrant.NewQueryNearest(
		qdrant.NewVectorInputDocument(&qdrant.Document{
			Model: "openrouter/mistralai/mistral-embed-2312",
			Text:  "How to bake cookies?",
		}),
	),
})
```
