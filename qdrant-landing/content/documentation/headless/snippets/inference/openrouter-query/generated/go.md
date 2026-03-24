```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Query: qdrant.NewQueryNearest(
		qdrant.NewVectorInputDocument(&qdrant.Document{
			Model: "openrouter/mistralai/mistral-embed-2312",
			Text:  "How to bake cookies?",
			Options: qdrant.NewValueMap(map[string]any{
				"openrouter-api-key": "<YOUR_OPENROUTER_API_KEY>",
			}),
		}),
	),
})
```
