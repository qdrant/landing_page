package snippet

import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	// @hide-start
	client, err := qdrant.NewClient(&qdrant.Config{
		Host:   "xyz-example.qdrant.io",
		Port:   6334,
		APIKey: "<paste-your-openrouter-key-here>",
		UseTLS: true,
	})
	// @hide-end

	if err != nil { panic(err) } // @hide

	ctx := qdrant.WithHeader(context.Background(), "openrouter-api-key", "<YOUR_OPENROUTER_API_KEY>")

	client.Upsert(ctx, &qdrant.UpsertPoints{
		CollectionName: "{collection_name}",
		Points: []*qdrant.PointStruct{
			{
				Id: qdrant.NewIDNum(uint64(1)),
				Vectors: qdrant.NewVectorsDocument(&qdrant.Document{
					Model: "openrouter/mistralai/mistral-embed-2312",
					Text:  "Recipe for baking chocolate chip cookies",
				}),
			},
		},
	})
}
