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
				Vectors: qdrant.NewVectorsImage(&qdrant.Image{
					Model: "jinaai/jina-clip-v2",
					Image: qdrant.NewValueString("https://qdrant.tech/example.png"),
					Options: qdrant.NewValueMap(map[string]any{
						"jina-api-key": "<YOUR_JINAAI_API_KEY>",
						"dimensions":   512,
					}),
				}),
			},
		},
	})
}
