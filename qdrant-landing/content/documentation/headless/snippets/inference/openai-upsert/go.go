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

	client.Upsert(ctx, &qdrant.UpsertPoints{
		CollectionName: "{collection_name}",
		Points: []*qdrant.PointStruct{
			{
				Id: qdrant.NewIDNum(uint64(1)),
				Vectors: qdrant.NewVectorsDocument(&qdrant.Document{
					Model: "openai/text-embedding-3-large",
					Text:  "Recipe for baking chocolate chip cookies",
					Options: qdrant.NewValueMap(map[string]any{
						"openai-api-key": "<YOUR_OPENAI_API_KEY>",
						"dimensions":     512,
					}),
				}),
			},
		},
	})
}
