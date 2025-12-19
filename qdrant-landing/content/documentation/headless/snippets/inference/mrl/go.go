package snippet

import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	client, err := qdrant.NewClient(&qdrant.Config{
		Host:   "xyz-example.qdrant.io",
		Port:   6334,
		APIKey: "<paste-your-api-key-here>",
		UseTLS: true,
	})

	if err != nil { panic(err) } // @hide

	client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: "{collection_name}",
		Points: []*qdrant.PointStruct{
			{
				Id: qdrant.NewIDNum(uint64(1)),
				Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{
					"large": qdrant.NewVectorDocument(&qdrant.Document{
						Model: "openai/text-embedding-3-small",
						Text:  "Recipe for baking chocolate chip cookies",
						Options: qdrant.NewValueMap(map[string]any{
							"openai-api-key": "<YOUR_OPENAI_API_KEY>",
						}),
					}),
					"small": qdrant.NewVectorDocument(&qdrant.Document{
						Model: "openai/text-embedding-3-small",
						Text:  "Recipe for baking chocolate chip cookies",
						Options: qdrant.NewValueMap(map[string]any{
							"openai-api-key": "<YOUR_OPENAI_API_KEY>",
							"mrl":            64,
						}),
					}),
				}),
			},
		},
	})
}
