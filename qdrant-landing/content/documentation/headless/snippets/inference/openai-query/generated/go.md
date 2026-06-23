```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

ctx := qdrant.WithHeader(context.Background(), "openai-api-key", "<YOUR_OPENAI_API_KEY>")

client.Query(ctx, &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Query: qdrant.NewQueryNearest(
		qdrant.NewVectorInputDocument(&qdrant.Document{
			Model: "openai/text-embedding-3-large",
			Text:  "How to bake cookies?",
			Options: qdrant.NewValueMap(map[string]any{
				"dimensions": 512,
			}),
		}),
	),
})
```
