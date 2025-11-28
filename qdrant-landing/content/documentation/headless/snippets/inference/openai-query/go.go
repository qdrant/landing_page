package snippet

import (
	"context"
	"time"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	client, err := qdrant.NewClient(&qdrant.Config{
		Host:   "xyz-example.qdrant.io",
		Port:   6334,
		APIKey: "<paste-your-api-key-here>",
		UseTLS: true,
	})

	client.Query(ctx, &qdrant.QueryPoints{
		CollectionName: "{collection_name}",
		Query: qdrant.NewQueryNearest(
			qdrant.NewVectorInputDocument(&qdrant.Document{
				Model: "openai/text-embedding-3-large",
				Text:  "How to bake cookies?",
				Options: qdrant.NewValueMap(map[string]any{
					"openai-api-key": "<YOUR_OPENAI_API_KEY>",
					"dimensions":     512,
				}),
			}),
		),
	})
}
