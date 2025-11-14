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
			Text:  "Mission to Mars",
			Model: "jinaai/jina-clip-v2",
			Options: qdrant.NewValueMap(map[string]any{
				"jina-api-key": "<YOUR_JINAAI_API_KEY>",
				"dimensions":   512,
			}),
		}),
	),
})
```