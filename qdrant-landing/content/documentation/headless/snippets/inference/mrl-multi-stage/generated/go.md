```go
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

ctx := qdrant.WithHeader(context.Background(), "openai-api-key", "<YOUR_OPENAI_API_KEY>")

client.Query(ctx, &qdrant.QueryPoints{
	CollectionName: "{collection_name}",
	Prefetch: []*qdrant.PrefetchQuery{
		{
			Query: qdrant.NewQueryNearest(
				qdrant.NewVectorInputDocument(&qdrant.Document{
					Model: "openai/text-embedding-3-small",
					Text:  "How to bake cookies?",
					Options: qdrant.NewValueMap(map[string]any{
						"mrl": 64,
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
		}),
	),
	Using: qdrant.PtrOf("large"),
	Limit: qdrant.PtrOf(uint64(10)),
})
```
