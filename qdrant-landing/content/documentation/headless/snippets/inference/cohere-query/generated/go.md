```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Query: qdrant.NewQueryNearest(
		qdrant.NewVectorInputDocument(&qdrant.Document{
			Text:  "a green square",
			Model: "cohere/embed-v4.0",
			Options: qdrant.NewValueMap(map[string]any{
				"cohere-api-key":   "<YOUR_COHERE_API_KEY>",
				"output_dimension": 512,
			}),
		}),
	),
})
```
