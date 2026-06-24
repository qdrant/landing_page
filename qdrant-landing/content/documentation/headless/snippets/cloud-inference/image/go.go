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
		APIKey: "<paste-your-api-key-here>",
		UseTLS: true,
	})
	// @hide-end

	if err != nil { panic(err) } // @hide
	defer client.Close()         // @hide

	client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: "<your-collection>",
		Points: []*qdrant.PointStruct{
			{
				Id: qdrant.NewIDNum(1),
				Vectors: qdrant.NewVectorsImage(&qdrant.Image{
					Model: "qdrant/clip-vit-b-32-vision",
					Image: qdrant.NewValueString("https://qdrant.tech/example.png"),
				}),
				Payload: qdrant.NewValueMap(map[string]any{
					"title": "Example image",
				}),
			},
		},
	})

	client.Query(context.Background(), &qdrant.QueryPoints{
		CollectionName: "<your-collection>",
		Query: qdrant.NewQueryNearest(
			qdrant.NewVectorInputDocument(&qdrant.Document{
				Text:  "Mission to Mars",
				Model: "qdrant/clip-vit-b-32-text",
			}),
		),
	})
}
