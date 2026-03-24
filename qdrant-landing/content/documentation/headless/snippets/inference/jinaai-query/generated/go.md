```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
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
