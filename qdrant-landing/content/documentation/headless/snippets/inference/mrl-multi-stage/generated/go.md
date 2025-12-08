```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

client, err := qdrant.NewClient(&qdrant.Config{
	Host:   "xyz-example.qdrant.io",
	Port:   6334,
	APIKey: "<paste-your-api-key-here>",
	UseTLS: true,
})

client.Query(context.Background(), &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Prefetch: []*qdrant.PrefetchQuery{
		{
			Query: qdrant.NewQueryNearest(
				qdrant.NewVectorInputDocument(&qdrant.Document{
					Model: "openai/text-embedding-3-small",
					Text:  "How to bake cookies?",
					Options: qdrant.NewValueMap(map[string]any{
						"mrl":            64,
						"openai-api-key": "<YOUR_OPENAI_API_KEY>",
					}),
				}),
			),
			Using: qdrant.PtrOf("small"),
			Limit: qdrant.PtrOf(uint64(1000)),
		},
	},
	Query: qdrant.NewQueryNearest(
		qdrant.NewVectorInputDocument(&qdrant.Document{
			Model: "openai/text-embedding-3-small",
			Text:  "How to bake cookies?",
			Options: qdrant.NewValueMap(map[string]any{
				"openai-api-key": "<YOUR_OPENAI_API_KEY>",
			}),
		}),
	),
	Using: qdrant.PtrOf("large"),
	Limit: qdrant.PtrOf(uint64(10)),
})
```
